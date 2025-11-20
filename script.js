const empresas = {};
const colores = ["#ff6384", "#36a2eb", "#4bc0c0", "#9966ff", "#ff9f40"];
let colorIndex = 0;
let inversionista = ""; // guardaremos el nombre aquí

const ctx = document.getElementById("grafico").getContext("2d");
const chart = new Chart(ctx, {
  type: "bar",
  data: {
    labels: [],
    datasets: []
  },
  options: {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: "Comparación de rendimientos (modelo saturación proporcional)",
        color: "#fff"
      },
      legend: {
        labels: { color: "#fff" }
      }
    },
    scales: {
      x: { ticks: { color: "#fff" } },
      y: { beginAtZero: true, ticks: { color: "#fff" } }
    }
  }
});

// Nueva fórmula: saturación proporcional al capital
// G(t) = I * rMax * (1 - e^(-k t))
function calcularRendimiento(t, capital, dinero, rMax = 0.4, k = 0.2) {
  const I = capital + dinero; // inversión total para el cálculo del rendimiento
  return I * rMax * (1 - Math.exp(-k * t));
}

document.getElementById("inversionForm").addEventListener("submit", (e) => {
  e.preventDefault();

  inversionista = document.getElementById("inversionista").value.trim();

  const empresa = document.getElementById("empresa").value.trim();
  const dinero = parseFloat(document.getElementById("dinero").value);
  const capital = parseFloat(document.getElementById("capital").value);
  const tiempo = parseInt(document.getElementById("tiempo").value);

  if (!empresa) return;

  const rendimiento = calcularRendimiento(tiempo, capital, dinero);

  // Si la empresa ya existe, preguntar confirmación
  if (empresas[empresa]) {
    const confirmar = confirm(`¿Seguro que lo deseas? Modificarás los datos de la empresa ${empresa}`);
    if (!confirmar) return;

    const fecha = new Date().toLocaleString();
    empresas[empresa].anterior = {
      rendimiento: empresas[empresa].rendimiento,
      fecha: fecha
    };

    empresas[empresa].dinero = dinero;
    empresas[empresa].capital = capital;
    empresas[empresa].tiempo = tiempo;
    empresas[empresa].rendimiento = rendimiento;

  } else {
    const color = colores[colorIndex % colores.length];
    colorIndex++;
    empresas[empresa] = {
      color,
      dinero,
      capital,
      tiempo,
      rendimiento,
      anterior: null
    };
  }

  actualizarGrafica();
  actualizarTabla();
  actualizarConclusiones();
});

function actualizarGrafica() {
  chart.data.labels = Object.keys(empresas);
  chart.data.datasets = [];

  Object.keys(empresas).forEach(nombre => {
    const e = empresas[nombre];

    chart.data.datasets.push({
      label: `${nombre} (actual)`,
      data: [e.rendimiento],
      backgroundColor: e.color
    });

    if (e.anterior) {
      chart.data.datasets.push({
        label: `${nombre} (anterior - ${e.anterior.fecha})`,
        data: [e.anterior.rendimiento],
        backgroundColor: hexToRgba(e.color, 0.4)
      });
    }
  });

  chart.update();
}

function hexToRgba(hex, alpha) {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function actualizarTabla() {
  const tbody = document.querySelector("#tablaResultados tbody");
  tbody.innerHTML = "";

  Object.keys(empresas).forEach(nombre => {
    const e = empresas[nombre];
    const fila = `
      <tr>
        <td>${nombre}</td>
        <td>$${e.dinero.toFixed(2)}</td>
        <td>$${e.capital.toFixed(2)}</td>
        <td>${e.tiempo}</td>
        <td>$${e.rendimiento.toFixed(2)}</td>
      </tr>
    `;
    tbody.innerHTML += fila;
  });
}

// ** FUNCIÓN CORREGIDA PARA EVALUAR LA RENTABILIDAD CORRECTAMENTE **
function actualizarConclusiones() {
  const div = document.getElementById("listaConclusiones");
  div.innerHTML = "";

  Object.keys(empresas).forEach(nombre => {
    const e = empresas[nombre];
    // Utilizamos el Capital Inicial como base para la Tasa de Retorno (ROI)
    const inversionBase = e.capital;
      
    // Evitamos la división por cero si el capital es cero
    const rendimientoPorcentaje = inversionBase > 0 ? (e.rendimiento / inversionBase) * 100 : 0;
    
    let conclusion;

    // --- Lógica de Conclusiones Financieramente Correcta ---
    
    // 1. Caso de NO Rentabilidad (Pérdida o Cero)
    if (e.rendimiento <= 0) {
      conclusion = `⚠️ ${inversionista}, la empresa ${nombre} **no fue rentable**, pues generó una pérdida (o un rendimiento nulo) de $${e.rendimiento.toFixed(2)}.`;
    } 
    // 2. Caso de Rentabilidad con Retorno Bajo (Umbral de 15% para considerarlo 'conveniente')
    else if (rendimientoPorcentaje < 15) { 
      conclusion = `🟡 ${inversionista}, la empresa ${nombre} **es rentable** (ganancia: $${e.rendimiento.toFixed(2)}), pero su **Tasa de Retorno** (${rendimientoPorcentaje.toFixed(2)}%) es baja para el período.`;
    }
    // 3. Caso de Rentabilidad con Buen Retorno (Umbral >= 15%)
    else {
      conclusion = `✅ ${inversionista}, la empresa ${nombre} **es rentable y conveniente**. Su rendimiento fue de $${e.rendimiento.toFixed(2)}, logrando una **Tasa de Retorno** del **${rendimientoPorcentaje.toFixed(2)}%** sobre el capital inicial.`;
    }

    // Mensaje adicional para retornos muy altos
    if (rendimientoPorcentaje >= 100) {
      conclusion += ` ¡Atención! Su ganancia **supera el 100%** de la inversión inicial.`;
    }

    // -----------------------------------------------------------

    const p = document.createElement("p");
    // Usamos innerHTML para que se interpreten los tags como <b> y los emojis
    p.innerHTML = conclusion;
    div.appendChild(p);
  });
}