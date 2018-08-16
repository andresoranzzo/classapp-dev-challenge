const fs = require('fs')
const _ = require('lodash')
const filePath='input.csv'
var arrayString = [];
var header = []
var json = []
fs.readFile(filePath,(err,data) => {
  if(err) throw err;
  //prepara string de entrada para transformar em json
  string = data;

  //arrayString será apenas para pegar as tags de email e phone, do header
  arrayString = _.split(string,'\n')
  arrayString = _.split(arrayString,' ')
  arrayString = _.split(arrayString,'"')
  arrayString = _.split(arrayString,',')
  arrayString = _.remove(arrayString, function(n){
    return n != '' 
  })

  //arrayString2 será para os dados em si
  arrayString2 = _.split(string,'\n')
  arrayString2 = _.split(arrayString2,',')
  arrayString2 = _.remove(arrayString2, function(n){
    return n != '\n' 
  })
  
  var arrayJson = []
  var json

  //contador dos elementos do arrayString (header)
  var i = 0

  //variaveis com as tags
  header['email-tags'] = []
  header['phone-tags'] = []
  var tags
  //prepara header com tags de email e phone
  do{
    if(arrayString[i] == 'email' || arrayString[i] == 'phone'){
      //guarda qual é a coluna atual do header
      var coluna = arrayString[i]
      //pegar tags email
      tags = []
      i++
      //enquanto houver tags a serem adicionadas, adiciona-as
      while(arrayString[i] != 'phone' && arrayString[i] != 'email' && arrayString[i] != 'invisible'){
        tags.push(arrayString[i])
        i++  
      }  
      i--
      //se a coluna atual for email, adiciona as tags de email
      if(coluna == 'email'){
        header['email-tags'].push(tags) 
      } else {
      //senao, adiciona as tags de phone
        header['phone-tags'].push(tags) 
      } 
    }
    i++
  }while(arrayString[i] != 'see_all')
  i++
  var j = 0
  var contEmail = 0
  var contPhone = 0
  //inicializa objeto 
  json = {} 
  json.fullname = '' 
  json.classes = []
  json.addresses = []
  json.invisible = false
  json.see_all = false
  //flag pra identificar se já existe aquele email cadastrado para aquela pessoa
  var flagJaTemEmail
  k = 0
  //desloca string para a parte dos dados
  while(k < arrayString2.length && !arrayString2[k].match('see_all')){
    k++
  }
  k++

  //contador para percorrer colunas (fullname,eid,etc)
  var j = 0
  //percorre string enquanto há dados
  while(k <= arrayString2.length - 1){
    switch(j){
      //fullname
      case 0:
        flagJaTemEmail = false
        //verifica se ja existe valor com esse nome
        var i = _.findIndex(arrayJson,function(o) { return o.fullname == arrayString2[k] })
        if(i >= 0){
          flagJaTemEmail = true
          json = arrayJson[i]
          arrayJson = _.remove(arrayJson, function(o) { return o.fullname != json.fullname })
        }
        json.fullname = arrayString2[k]
        j++
        break;
      //eid
      case 1:
        //se existe eid no formato dddd
        if(arrayString2[k].match(/[\d]{4}/)){
          json.eid = _.words(arrayString2[k],/[\d]{4}/)[0]
        }
        j++
        break;
      //class
      case 2: case 3:
        if(arrayString2[k].match(/Sala [\d]/)){
          var array = []
          array = _.split(arrayString2[k],'/')
          var l
          var aux
          //se existir mais de uma sala, adiciona cada uma
          for(l=0; l < array.length;l++){
            aux = _.words(array[l],/Sala [\d]/)[0]
            json.classes.push(aux)
          }
        }
        j++
        break;
      //email
      case 4: case 7: case 8:
       //verifica se houve erro na leitura do telefone e ajusta coluna
        if(arrayString2[k].match(/Sala/)){
          j--
          k--
          break;
        }
        //verifica se o dado é um email
        if(arrayString2[k].match(/@/)){
          //separa, caso exista mais de um email no campo, separado por '/'
          array = _.split(arrayString2[k],'/')
          array = _.remove(array, function(n){
            return n != ' ' 
          })
          if(flagJaTemEmail){
            //busca se há email já inserido com esse conjunto de tags
            var i = _.findIndex(json.addresses, function(o) { return o.tags == header['email-tags'][contEmail]})
            //se ja tiver email com aquela(s) tag(s), considera apenas o mais atual.
            //Ex: uma mesma pessoa com 2 emails cadastrados para Responsavel, Pai. Considera o mais recente neste caso
            if(i >= 0){
              _.remove(json.addresses, function(o) { return o.tags == header['email-tags'][contEmail]})
            }
          }
          var l
          //analisa cada email
          for(l=0; l < array.length;l++){
            if(array[l].match(/@/)){
              var aux = _.split(array[l],' ')
              //se email ja existe para aquela pessoa (repetido), só adiciona a tags no mesmo objeto endereço
              var i = _.findIndex(json.addresses, function(o) {return o.address == aux[0]})
              if(i >= 0){
                var auxTags = _.slice(json.addresses[i].tags)
                var stringTag = '' + header['email-tags'][contEmail]
                auxTags.push(stringTag)
                json.addresses[i].tags = auxTags
              } else {
                //se nao existe, cria novo objeto endereço e insere
                //inicializa endereço
                var objEndereco = {}
                objEndereco.tags = header['email-tags'][contEmail]
                objEndereco.type = 'email'
                objEndereco.address = aux[0]
                //adiciona endereço
                json.addresses.push(objEndereco)
              }
            }
          }
        }
        j++
        contEmail++
        break;
      case 5: case 6: case 9:
        //verifica se existe numero de pelo menos 8 digitos
        if(arrayString2[k].match(/[0-9]{8}/)){
          var numero = '55'
          var objEndereco = {}
          objEndereco.tags = header['phone-tags'][contPhone]
          objEndereco.type = 'phone'
          //concatena primeiro o DDD e depois o telefone
          numero += _.words(arrayString2[k])[0]
          numero += _.words(arrayString2[k])[1]
          objEndereco.address = numero
          //adiciona endereco
          json.addresses.push(objEndereco)
        }
        j++
        contPhone++
        break;
      case 10:
      //invisible
        if(arrayString2[k].match(/[0-1]/)){
          if(arrayString2[k] == '1')
            json.invisible = true
          else if(arrayString2[k] == '0')
            json.invisible = false
        }
        j++
        break;
      case 11:
      //see_all
        if(arrayString2[k] == 'yes'){
          json.see_all = true
        } else if(arrayString2[k] = 'no'){
          json.see_all = false
        }
        //reseta coluna
        j = 0
        //reseta contadores de coluna de email e telefone
        contEmail = 0
        contPhone = 0
        //adiciona objeto na lista
        arrayJson.push(json)
        //reseta objeto para proxima iteracao
        json = {} 
        json.fullname = '' 
        json.classes = []
        json.addresses = []
        json.invisible = false
        json.see_all = false
        break;
    }
    k++
  }
  //salva em arquivo json
  var stringFile = JSON.stringify(arrayJson)
  fs.writeFile('output.json',stringFile, err => {
    if (err) throw err;
    console.log('The file has been saved!');
  })  
})


