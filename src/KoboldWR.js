//declarações iniciais
const TelegramBot = require('node-telegram-bot-api');
const token = require("./infra/environment").token;
  
const bot = new TelegramBot(token, {polling: true});

const Mongo = require("./infra/Mongo");

const emoji = require("node-emoji").emoji;
const UI = require("./infra/UI");

const Grafico = require("./infra/chart");

var request = require('request');
var url = require("./infra/environment").Wind;

var online = 0;

//espera as primeiras execuções do programa
function a(){
    return online++;
}

setTimeout(a, 300000);

/* */

//variáveis de data
var data = new Date();
var dia = data.getDate();
var mes = data.getMonth()+1;
var ano = data.getFullYear();
var hora = data.getHours();
var minuto = ('0'+data.getMinutes()).slice(-2);

//atualiza a data
function Agora(){
    data = new Date();
    dia = data.getDate();
    mes = data.getMonth()+1;
    ano = data.getFullYear();
    hora = data.getHours();
    minuto = ('0'+data.getMinutes()).slice(-2);
}

/* */

//se inscreve no mqtt
const mqtt = require('mqtt');
const mqttclient = mqtt.connect('mqtt://broker.mqttdashboard.com');
const sub = require("./infra/environment").sub;

mqttclient.subscribe(`${sub}/+`);

var Temp;
var Pres;
var Umid;
var clima;

//espera atualização do mqtt pelos sensores e atualiza as variáveis
mqttclient.on('message', async function (topic, message) {

    if (topic === `${sub}/Temp`){
        Temp = message;
        Temp = parseFloat(Temp)
        //console.log(Temp);
    } else if (topic === `${sub}/Umid`){
        Umid = message;
        Umid = parseFloat(Umid);
        //console.log(Umid);
    } else if (topic === `${sub}/Pres`){
        Pres = message
        Pres = parseFloat(Pres);
        //console.log(Pres);
    }

    //atualiza o emoji que representa o clima
    clima = UI.testarClimão(Temp, Pres, Umid);
    //console.log(clima);
})
/* */

var Vent;

//pega informação do vento
async function CataVento (){
    await request(url, async function (err, response, body) {
        if (err) {
            console.log('error:', error);
        } else {
            let weather = await JSON.parse(body);
            Vent = parseFloat((weather.wind.speed * 3.6).toFixed(2));
        }
    });
}

setInterval(CataVento, 240000)
/* */
var lastid;

//pega o último id do banco de dados e atualiza
async function Attid (){
    try{
        let client = await Mongo.conectarMongo();
        let db = client.db("KoboldWR");
        let collection = db.collection("data");
        //escolher o último id
        let result = await collection.find({}, { projection: { _id: 0, id: 1} }).sort({id:-1}).limit(1).toArray();
        for (let part of result) {
            lastid = part.id;
        }
        lastid++;
        console.log(lastid);
        await Mongo.desconectarMongo(client);
    }catch(e){
        console.log(e);
    }
}

/* */

bot.onText(/\/echo (.+)/, (msg, match) => {

  const chatId = msg.chat.id;
  const resp = match[1];

  bot.sendMessage(chatId, resp);
});

//espera mensagem pelo telegram
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    
    //espera as primeiras execuções do programa
    if (online == 1){
    
    //comandos do bot
    //começar a conversa ou dar /help
    if (msg.text === "/start" || msg.text === "/help"){
    bot.sendMessage(chatId, `
        Kobold Weather Report 1.8\n\t\tDigite:\n\t\t/help..................para receber os comandos possíveis\n\t\t/assinar.............para atualizações periódicas\n\t\t/clima.................para receber as informações do momento\n\t\t/cancelar..............para parar de receber atualizações diárias\n\t\t/grafico..............para parar de receber um gráfico com o histórico de vento e temperatura dos últimos 5 dias`);
    } 
    
    //assinar
    else if (msg.text === "/assinar"){
      try{
            let client = await Mongo.conectarMongo();
            let db = client.db("KoboldWR");
            let collection = db.collection("users");
            let assinantes = await collection.find({}).toArray();
                for (usuario of assinantes){
                    if (chatId == usuario.telegramId){
                    bot.sendMessage(chatId, `Você já é assinante. Use '/help' para ver os comandos`);
                    await Mongo.desconectarMongo(client);
                    return;
                    }
                }
            Agora();
            let user = {
                telegramId: chatId,
                dataCadastro: [dia,mes,ano,hora,minuto],
            };
            await collection.insertOne(user, async (err, resultado) => {
            if(err){console.log(err);return;}
            bot.sendMessage(chatId, `Você receberá atualizações periódicas!\nA qualquer momento digite '/clima' para receber as informações na hora`);
            await Mongo.desconectarMongo(client);
            });
        }catch(e){
            bot.sendMessage(chatId, `Ocorreu um erro, tente novamente mais tarde`);
            console.log(e);
        }
    } 

    //cancela a assinatura
    else if (msg.text === "/cancelar"){
        try{
            let client = await Mongo.conectarMongo();
            let db = client.db("KoboldWR");
            let collection = db.collection("users");
            await collection.deleteOne({ telegramId: chatId }, async (err, resultado) => {
              if (err) {
                    console.log(err);
                    bot.sendMessage(chatId, "Ocorreu um erro, tente novamente mais tarde");
                } else {
                    bot.sendMessage(chatId, `Você cancelou as atualizações periódicas, digite '/assinar' para voltar a receber todo dia ou '/clima' para receber na hora`);
                }
                await Mongo.desconectarMongo(client);
            });
        } 
        
        catch (erro) {
          bot.sendMessage(chatId, "Ocorreu um erro, tente novamente mais tarde");
          console.log(erro);
        }
    }

    //dá as últimas atualizações do clima
    else if (msg.text === "/clima"){
        Agora();
        bot.sendMessage(chatId, `Clima\n\t\t${clima}\n\t\t${dia}/${mes}/${ano}, ${hora}:${minuto}\n\t\tTemperatura: ${Temp} C\n\t\tPressão: ${Pres} hPa\n\t\tUmidade: ${Umid} %\n\t\tVento: ${Vent} km/h`);
    }

    //manda uma imagem do gráfico
    else if (msg.text === "/grafico"){
        bot.sendPhoto(chatId, 'src/grafico/grafico.png')
        bot.sendMessage(chatId, `Feito!`);
    }
    } else{
        bot.sendMessage(chatId, `Por favor aguarde, estamos em manutenção ${emoji.wrench}`);

    }

});

//manda os dados para o banco dos dados (MongoDB)
async function PostaDados(){
    try{
        Agora();
        let client = await Mongo.conectarMongo();
        let db = client.db("KoboldWR");
        let collection = db.collection("data");
        await Attid();
        let dados = {
            id: lastid,
            dataDados: [dia,mes,ano,hora,minuto],
            temperatura: Temp,
            pressão: Pres,
            umidade: Umid,
            vento: Vent,
        };
        //console.log(dados);
        await collection.insertOne(dados, async (err, resultado) => {
            if(err){console.log(err);return;}
            await Mongo.desconectarMongo(client);})
    }catch(e){
        console.log(e);
    }
    setTimeout(Fazgrafico, 30000)   
}

setInterval(PostaDados, 2400000);
//4 minutos

//pega os últimos 5 dados e faz um gráfico de temperatura e vento
async function Fazgrafico(){
    try{
        let client = await Mongo.conectarMongo();
        let db = client.db("KoboldWR");
        let collection = db.collection("data");
        let results = await collection.find({}, { projection: { _id: 0, temperatura: 1, vento: 1, dataDados: 1 } }).sort({id: -1}).limit(5).toArray();
        let GTemp = [];
        let GVent = [];
        let Gday = []; 
        for (let part of results) {
            GTemp.push(part.temperatura);
            GVent.push(part.vento);
            Gday.push(`${part.dataDados[0]} / ${part.dataDados[1]}, ${part.dataDados[3]}:${part.dataDados[4]}`);
        }
        GTemp.reverse();
        GVent.reverse();
        Gday.reverse();
        console.log(GTemp);
        console.log(GVent);
        console.log(Gday);
        Grafico.MakeChart(GTemp,GVent,Gday);
        console.log("gráfico atualizado!");
        await Mongo.desconectarMongo(client);
    }catch(e){
        console.log(e);
    }
} Fazgrafico();

//vê quais ids estão inscritos e manda as informações de clima a cada tempo
async function analisaAssinatura(){
    try {
        let client = await Mongo.conectarMongo();
        let db = client.db("KoboldWR");
        let collection = db.collection("users");
        let assinantes = await collection.find({}).toArray();
        Agora();
        for (usuario of assinantes) {
          bot.sendMessage(usuario.telegramId, `Clima:\n\t\t${clima}\n\t\t${dia}/${mes}/${ano}, ${hora}:${minuto}\n\t\tTemperatura: ${Temp} C\n\t\tPressão: ${Pres} hPa\n\t\tUmidade: ${Umid} %\n\t\tVento: ${Vent} km/h`);
        }
        await Mongo.desconectarMongo(client);
      } catch (erro) {
        console.log(erro);
      }
}

setInterval(analisaAssinatura, 12000000);
//20 minutos