var connectedToConversation = false;
var disconnected = false;
var _routingData;
var token;
//Sæt en default routing streng i variablen herunder, eller lad stå tomt hvis ingen ønskes.
var _routingStr = 'WebChatDSR';
var _keyValuePairs;
//Sæt besked til brugeren af webchatten på hjemmesiden, der vises, når agenten i desktop afslutter samtalen
var agentDisconnectedMessage = "Agenten har forladt samtalen";
//Sæt besked der vises når der skabt forbindelse til botten
var waitForAgentMessage = "Vent venligst mens vi finder en ledig medarbejder";
//Sæt besked der vises i tilfælde af at botten ikke kan finde en chatservice at forbinde sig til
var noChatServiceFoundMessage = "Chatten er ikke tilgængelig lige nu";

document.getElementById('routingStr').innerHTML = _routingStr;


const store = window.WebChat.createStore({},
    ({ dispatch }) => next => action => {
        if (action.type === 'DIRECT_LINE/CONNECT_FULFILLED') {

            if (connectedToConversation === false) {
                dispatch({
                    type: 'WEB_CHAT/SEND_EVENT',
                    payload: {
                        name: 'webchat/join',
                        value: { language: window.navigator.language },
                    }
                });

                connectedToConversation = true;
            }
        }

        if (action.type === 'DIRECT_LINE/INCOMING_ACTIVITY') {

            if (action.payload.activity.type === 'event') {

                if (action.payload.activity.name == 'webchat/disconnected' && connectedToConversation) {

                    action.payload.activity.type = 'message';
                    action.payload.activity.text = agentDisconnectedMessage;

                    if (disconnected === false) {
                        renderWebchatOnDisconnect();
                        disconnected = true;
                    }
                }

                if (action.payload.activity.name == 'webchat/findingAgent' && waitForAgentMessage !== "") {

                    action.payload.activity.type = 'message';
                    action.payload.activity.text = waitForAgentMessage;
                }

                if (action.payload.activity.name == 'webchat/noChatServiceFound') {

                    action.payload.activity.type = 'message';
                    action.payload.activity.text = noChatServiceFoundMessage;
                }
            }

            if (action.payload.activity.type === 'message' && action.payload.activity.text.startsWith('ERROR')) {

                console.log(action.payload.activity.text);
                action.payload.activity.text = "";

            }
        }

        return next(action);
    });

async function renderWebChat() {

    var responseData = await GenerateToken();
    token = responseData.token;

    //Herunder styler du alt indenfor selve webchat vinduet. Man kan finde eksempler online på, hvordan man styler chatten
    //Bla. her: https://github.com/microsoft/BotFramework-WebChat/blob/main/samples/README.md
    const styleOptions = {

        hideUploadButton: true,

        botAvatarBackgroundColor: '#1D202D',
        botAvatarBorderColor: '#F4F4F4',
        botAvatarImage: 'kermit.png',
        botAvatarInitials: '',
        bubbleBackground: '#126586a1',
        bubbleBorderColor: '#F4F4F4',
        bubbleBorderRadius: 5,
        bubbleBorderWidth: 1,
        bubbleNubOffset: 0,
        bubbleNubSize: 10,

        userAvatarBackgroundColor: '#005a87',
        userAvatarInitials: 'Dig',
        bubbleFromUserBackground: '#9bbe4bcf',
        bubbleFromUserBorderColor: '#F4F4F4',
        bubbleFromUserBorderRadius: 5,
        bubbleFromUserBorderWidth: 1,
        bubbleFromUserNubOffset: 0,
        bubbleFromUserNubSize: 10,
    };

    if (_routingStr != null) {
        _routingData = '{"RoutingData":"' +
            _routingStr +
            '","KeyValuePairs":';
    }
    else {
        _routingData = '{"RoutingData": "null","KeyValuePairs":';
    }

    if (_keyValuePairs != null) {
        var object = JSON.parse(_keyValuePairs);
        var keys = Object.keys(object);
        var str = '[';

        keys.forEach((key, index) => {
            str += '{"Key": "' + key + '", "Value": "' + object[key] + '"}, ';
        });

        str += ']}';

        _routingData += str;
    }
    else {
        _routingData += '"null"}';
    }

    window.WebChat.renderWebChat(
        {
            directLine: window.WebChat.createDirectLine({
                token
            }),
            store,
            username: _routingData,
            styleOptions,
            locale: 'da-DK'
        },
        document.getElementById('webchat')
    );

    window.addEventListener('Disconnect',
        ({ data }) => {
            store.dispatch({
                type: 'WEB_CHAT/SEND_EVENT',
                payload: {
                    name: 'webchat/disconnected',
                    value: { language: window.navigator.language }
                }
            });
        });
}

function disconnectWebChat() {
    const eventSendMessage = new Event('Disconnect');
    window.dispatchEvent(eventSendMessage);
    connectedToConversation = false;
    document.getElementById('webchat').style.display = "none";
    document.getElementById('beginChat').style.display = "unset";
    document.getElementById('endChat').style.display = "none";
}

function setWebChatRoutingString(routingStr) {
    _routingStr = routingStr;
    document.getElementById('routingStr').innerHTML = _routingStr;

}

function setKeyValuePairs(keyValuePairs) {
    _keyValuePairs = keyValuePairs;
}

async function GenerateToken() {

    //Det rådes til at man henter sin token ud fra sin egen backend ved hjælp af et api-kald, 
    //så ens secret ikke eksisterer i klienten/browseren

    //Så noget i stil med:

    //const response = await fetch('https:<DIN_TOKEN_SERVER/API>', {method: 'POST'});

    //Til at teste med kan nedenstående bruges, men ellers er det den del der rådes til at ligge på backenden, 
    //hvorfra man henter sin token


    var secret = 'a54tkYr8pDc.Lr1EUE4pwEolWkJHE6I5hY_RAXT4LS9AFciL9ZYx_Yo';

    const response = await fetch('https://directline.botframework.com/v3/directline/tokens/generate', {
        method: "POST",
        headers: { "Authorization": "Bearer " + secret }
    });

    return response.json();
}


function handleSubmit(event) {
    event.preventDefault();
    const data = new FormData(event.target);
    const value = Object.fromEntries(data.entries());
    const keyValuePairsJsonString = JSON.stringify(value);
    setKeyValuePairs(keyValuePairsJsonString);
    document.getElementById('webchat').style.display = "block";
    document.getElementById('userInfoForm').style.display = "none";
    document.getElementById('endChat').style.display = "unset";
    document.getElementById('beginChat').style.display = "none";
    renderWebChat();

}
const form = document.getElementById('webChatForm');
form.addEventListener('submit', handleSubmit);

function renderUserInfoForm() {
    document.getElementById('userInfoForm').style.display = "block";
    document.getElementById('beginChat').style.display = "none";
}

async function renderWebchatOnDisconnect() {

    window.WebChat.renderWebChat(
        {
            directLine: window.WebChat.createDirectLine({
                token
            }),
            store,
            username: _routingData,
            styleOptions: {

                hideUploadButton: true,

                botAvatarBackgroundColor: '#1D202D',
                botAvatarBorderColor: '#F4F4F4',
                botAvatarImage: 'INDSÆT STI TIL VALGFRIT BILLEDE DER REPRÆSENTERE AGENTEN I SAMTALEN',
                botAvatarInitials: '',
                bubbleBackground: '#126586a1',
                bubbleBorderColor: '#F4F4F4',
                bubbleBorderRadius: 5,
                bubbleBorderWidth: 1,
                bubbleNubOffset: 0,
                bubbleNubSize: 10,

                userAvatarBackgroundColor: '#005a87',
                userAvatarInitials: 'Dig',
                bubbleFromUserBackground: '#9bbe4bcf',
                bubbleFromUserBorderColor: '#F4F4F4',
                bubbleFromUserBorderRadius: 5,
                bubbleFromUserBorderWidth: 1,
                bubbleFromUserNubOffset: 0,
                bubbleFromUserNubSize: 10,

                hideSendBox: true
            },
            locale: 'da-DK'
        },
        document.getElementById('webchat')
    );
}