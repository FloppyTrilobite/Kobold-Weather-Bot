const ChartJsImage = require('chartjs-to-image');
const chart = new ChartJsImage();

// faz o gráfico de temperatura e vento
async function MakeChart(GTemp,GVent,Gday){
    chart.setConfig({
        type: 'line',
        data: {
            labels: Gday,
            datasets: [{
                label: 'Temperatura (C°)',
                data: GTemp,
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            },{
                label: 'Vento (km/h)',
                data: GVent,
                fill: false,
                borderColor: 'rgb(240, 120, 60)',
                tension: 0.1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                }
            }
        }
    });

    chart.toFile('src/grafico/grafico.png');
}

module.exports = {MakeChart};