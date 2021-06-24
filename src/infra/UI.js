const emoji = require("node-emoji").emoji;

//usa valores (arbitrários) para determinar o emoji que representa o clima
/*
    pressão baixa, temperatura alta, umidade alta = chuva
    pressão baixa, temperatura alta, umidade baixa = nublado 
    pressão baixa, temperatura baixa, umidade alta = nublado
    pressão baixa, temperatura baixa, umidade baixa = sol
    pressão alta, temperatura alta, umidade alta = nublado
    pressão alta, temperatura alta, umidade baixa = nublado
    pressão alta, temperatura baixa, umidade alta = sol
    pressão alta, temperatura baixa, umidade baixa = sol


    pressão baixa, temp alta = chuva
*/
function testarClimão(t, p, u){

    var climaEmoji;

    //pressão baixa
    if (p < 1015){
        //temperatura baixa
        if (t < 24){
            //umidade baixa
            if (u<70){
                climaEmoji = `${emoji.sunny}`;
            }
            //umidade alta
            else{
                climaEmoji = `${emoji.sun_behind_rain_cloud}`;
            }
        }
        //temperatura alta
        else{
            //umidade baixa
            if (u<70){
                climaEmoji = `${emoji.sun_behind_rain_cloud}`;
            }
            //umidade alta
            else{
                climaEmoji = `${emoji.rain_cloud}`;
            }
        }
    } 
    //pressão alta
    else{
        //temperatura baixa
        if (t < 24){
            //umidade baixa
            if (u<70){
                climaEmoji = `${emoji.sunny}`;
            }
            //umidade alta
            else{
                climaEmoji = `${emoji.sunny}`;
            }
        }
        //temperatura alta
        else{
            //umidade baixa
            if (u<70){
                climaEmoji = `${emoji.sun_behind_cloud}`;
            }
            //umidade alta
            else{
                climaEmoji = `${emoji.sun_behind_cloud}`;
            }
        }
    }

    return climaEmoji;
}

module.exports= {testarClimão};