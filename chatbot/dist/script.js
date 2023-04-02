function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; } //Thanks to the following for help:
// * https://codepen.io/johnludena/pen/JvMvzB
// * https://codepen.io/jenning/pen/JZzeJW

var data = {
    headerText: "hello hello ✨",
    pText: "I'm your cute bot!",
    p2Text: "Made with love by Rahul",
    userMessages: [],
    botMessages: [],
    botGreeting: "oh hi! How are you?",
    botLoading: false
};


class App extends React.Component {
    constructor(props) {
        super(props);
        _defineProperty(this, "updateUserMessages",




            newMessage => {
                if (!newMessage) {
                    return;
                }

                var updatedMessages = this.state.userMessages;

                var updatedBotMessages = this.state.botMessages;

                this.setState({
                    userMessages: updatedMessages.concat(newMessage),
                    botLoading: true
                });


                // Replace with your Dialogflow client token
                var request = new Request(
                    "https://api.dialogflow.com/v1/query?v=20150910&contexts=shop&lang=en&query=" +
                    newMessage +
                    "&sessionId=12345", {
                        headers: new Headers({
                            // Authorization: "Bearer bc13467053ad45feaaa6f23c8bfafa9d"
                            Authorization: "Bearer 956beb07b3514be6810db9666a3bf75b"
                        })
                    });




                fetch(request).
                then(response => response.json()).
                then(json => {
                    var botResponse = json.result.fulfillment.speech;

                    this.setState({
                        botMessages: updatedBotMessages.concat(botResponse),
                        botLoading: false
                    });

                }).
                catch(error => {
                    console.log("ERROR:", error);
                    this.setState({
                        botMessages: updatedBotMessages.concat('?'),
                        botLoading: false
                    });

                });
            });
        _defineProperty(this, "scrollBubble",

            element => {
                if (element != null) {
                    element.scrollIntoView(true);
                }
            });
        _defineProperty(this, "showMessages",

            () => {
                var userMessages = this.state.userMessages;
                var botMessages = this.state.botMessages;

                var allMessages = [];

                var i = 0;
                for (; i < userMessages.length; i++) {
                    if (i === userMessages.length - 1) {
                        //if bot replied to last message
                        if (botMessages[i]) {
                            allMessages.push(React.createElement(UserBubble, { message: userMessages[i] }));
                            allMessages.push(
                                React.createElement(BotBubble, { message: botMessages[i], thisRef: this.scrollBubble }));

                        } else {
                            allMessages.push(
                                React.createElement(UserBubble, { message: userMessages[i], thisRef: this.scrollBubble }));

                        }
                        break;
                    }

                    allMessages.push(React.createElement(UserBubble, { message: userMessages[i] }));
                    allMessages.push(React.createElement(BotBubble, { message: botMessages[i] }));
                }

                allMessages.unshift(
                    React.createElement(BotBubble, {
                        message: this.state.botGreeting,
                        thisRef: i === 0 ? this.scrollBubble : ""
                    }));



                return React.createElement("div", { className: "msg-container" }, allMessages);
            });
        _defineProperty(this, "onInput",

            event => {
                if (event.key === "Enter") {
                    var userInput = event.target.value;

                    this.updateUserMessages(userInput);
                    event.target.value = "";
                }

                if (event.target.value != "") {
                    event.target.parentElement.style.background = 'rgba(69,58,148,0.6)';
                } else {
                    event.target.parentElement.style.background = 'rgba(255, 255, 255, 0.6)';
                }
            });
        _defineProperty(this, "onClick",

            () => {
                var inp = document.getElementById("chat");
                var userInput = inp.value;

                this.updateUserMessages(userInput);
                inp.value = "";
            });
        this.state = data;
    }

    render() {
        return (
            React.createElement("div", { className: "app-container" },
                React.createElement(Header, {
                    headerText: this.state.headerText,
                    pText: this.state.pText,
                    p2Text: this.state.p2Text
                }),

                React.createElement("div", { className: "chat-container" },
                    React.createElement(ChatHeader, null),
                    this.showMessages(),
                    React.createElement(UserInput, { onInput: this.onInput, onClick: this.onClick }))));



    }
}


class UserBubble extends React.Component {
    render() {
        return (
            React.createElement("div", { className: "user-message-container", ref: this.props.thisRef },
                React.createElement("div", { className: "chat-bubble user" },
                    this.props.message)));



    }
}


class BotBubble extends React.Component {
    render() {
        return (
            React.createElement("div", { className: "bot-message-container", ref: this.props.thisRef },
                React.createElement("div", { className: "bot-avatar" }),
                React.createElement("div", { className: "chat-bubble bot" },
                    this.props.message)));



    }
}


var Header = props => {
    return (
        React.createElement("div", { className: "header" },
            React.createElement("div", { className: "header-img" }),
            React.createElement("h1", null, " ", props.headerText, " "),
            React.createElement("h2", null, " ", props.pText, " "),
            React.createElement("p", null, " ", props.p2Text, " ")));


};

var ChatHeader = props => {
    return (
        React.createElement("div", { className: "chat-header" },
            React.createElement("div", { className: "dot" }),
            React.createElement("div", { className: "dot" }),
            React.createElement("div", { className: "dot" })));


};

var UserInput = props => {
    return (
        React.createElement("div", { className: "input-container" },
            React.createElement("input", {
                id: "chat",
                type: "text",
                onKeyPress: props.onInput,
                placeholder: "type something"
            }),

            React.createElement("button", { className: "input-submit", onClick: props.onClick })));
};

ReactDOM.render(React.createElement(App, null), document.getElementById("app"));