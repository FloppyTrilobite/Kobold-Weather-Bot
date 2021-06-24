const mongoUri = require("./environment").mongoUri;

const {MongoClient} = require('mongodb');

//conecta no banco de dados
async function conectarMongo(){
    
    const client = new MongoClient(mongoUri, {useUnifiedTopology: true});

    try{
        await client.connect();
        console.log('conectado');
        return client;
    }catch(e){
        console.log(e);
    }
}

//desconecta no banco de dados
async function desconectarMongo(client){
    if(client){
        try{
            await client.close();
            console.log('desconectado');
        }catch(e){
            console.log(e);
        }
    }
}

module.exports = {conectarMongo, desconectarMongo};