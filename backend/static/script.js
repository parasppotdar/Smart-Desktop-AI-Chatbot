// =========================================================
// DOM ELEMENTS
// =========================================================

const messagesContainer = document.getElementById("messages");
const input = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const newChatBtn = document.getElementById("newChatBtn");
const historyList = document.getElementById("historyList");


// =========================================================
// STATE
// =========================================================

let conversationHistory = [];

let recentChats = [];


// =========================================================
// MARKDOWN CONFIG
// =========================================================

marked.setOptions({
    gfm: true,
    breaks: true
});


// =========================================================
// INITIALIZATION
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

    attachSuggestionEvents();

    input.focus();

});


// =========================================================
// ADD MESSAGE
// =========================================================

function addMessage(text, type) {

    const welcome = document.getElementById("welcome");

    if (welcome) {
        welcome.remove();
    }


    const messageWrapper = document.createElement("div");

    messageWrapper.className =
        `message ${type}`;


    const bubble = document.createElement("div");

    bubble.className = "bubble";


    if (type === "ai") {

        const renderedMarkdown =
            marked.parse(text);


        const safeHTML =
            DOMPurify.sanitize(
                renderedMarkdown,
                {
                    USE_PROFILES: {
                        html: true
                    }
                }
            );


        bubble.innerHTML = safeHTML;


        renderMath(bubble);

    } else {

        bubble.textContent = text;

    }


    messageWrapper.appendChild(bubble);

    messagesContainer.appendChild(
        messageWrapper
    );


    scrollToBottom();

}


// =========================================================
// MATH RENDERING
// =========================================================

function renderMath(element) {

    if (
        window.MathJax &&
        typeof MathJax.typesetPromise === "function"
    ) {

        MathJax.typesetPromise([element])
            .catch(() => {});

    }

}


// =========================================================
// TYPING INDICATOR
// =========================================================

function showTyping() {

    const typingWrapper =
        document.createElement("div");


    typingWrapper.className =
        "message ai";


    typingWrapper.id =
        "typingMessage";


    typingWrapper.innerHTML = `
        <div class="bubble">
            <div class="typing">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;


    messagesContainer.appendChild(
        typingWrapper
    );


    scrollToBottom();
}


// =========================================================
// REMOVE TYPING
// =========================================================

function removeTyping() {

    const typing =
        document.getElementById(
            "typingMessage"
        );


    if (typing) {
        typing.remove();
    }

}


// =========================================================
// SCROLL
// =========================================================

function scrollToBottom() {

    messagesContainer.scrollTo({

        top: messagesContainer.scrollHeight,

        behavior: "smooth"

    });

}


// =========================================================
// HISTORY SIDEBAR
// =========================================================

function addRecentChat(text) {

    const cleanText =
        text
            .replace(/\s+/g, " ")
            .trim();


    if (!cleanText) {
        return;
    }


    recentChats.unshift(
        cleanText
    );


    recentChats =
        recentChats.slice(0, 8);


    renderRecentChats();
}


// =========================================================
// RENDER RECENT CHATS
// =========================================================

function renderRecentChats() {

    historyList.innerHTML = "";


    recentChats.forEach((chat) => {

        const item =
            document.createElement("div");


        item.className =
            "history-item";


        item.textContent =
            chat;


        historyList.appendChild(item);

    });

}


// =========================================================
// SEND MESSAGE
// =========================================================

async function sendMessage() {

    const text =
        input.value.trim();


    if (!text) {
        return;
    }


    if (sendBtn.disabled) {
        return;
    }


    // -----------------------------------------
    // Show user message
    // -----------------------------------------

    addMessage(
        text,
        "user"
    );


    addRecentChat(text);


    // -----------------------------------------
    // Save user message
    // -----------------------------------------

    const previousHistory =
        [...conversationHistory];


    conversationHistory.push({

        role: "user",

        content: text

    });


    // -----------------------------------------
    // Clear input
    // -----------------------------------------

    input.value = "";

    input.style.height = "auto";


    sendBtn.disabled = true;


    showTyping();


    try {

        const response =
            await fetch(
                "/api/chat",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        message: text,

                        history:
                            previousHistory

                    })
                }
            );


        const data =
            await response.json();


        removeTyping();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "The AI service is unavailable."
            );

        }


        // -----------------------------------------
        // Show AI response
        // -----------------------------------------

        addMessage(
            data.reply,
            "ai"
        );


        // -----------------------------------------
        // Save AI response
        // -----------------------------------------

        conversationHistory.push({

            role: "model",

            content: data.reply

        });


    } catch (error) {

        removeTyping();


        // Remove unsent user message
        conversationHistory =
            previousHistory;


        addMessage(
            "I'm having trouble connecting right now. Please try again in a moment.",
            "ai"
        );

    } finally {

        sendBtn.disabled = false;

        input.focus();

    }

}


// =========================================================
// SEND BUTTON
// =========================================================

sendBtn.addEventListener(
    "click",
    sendMessage
);


// =========================================================
// ENTER KEY
// =========================================================

input.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            sendMessage();

        }

    }
);


// =========================================================
// AUTO RESIZE TEXTAREA
// =========================================================

input.addEventListener(
    "input",
    () => {

        input.style.height =
            "auto";


        input.style.height =
            `${Math.min(
                input.scrollHeight,
                150
            )}px`;

    }
);


// =========================================================
// NEW CHAT
// =========================================================

newChatBtn.addEventListener(
    "click",
    () => {

        conversationHistory = [];


        messagesContainer.innerHTML = `
            <div
                id="welcome"
                class="welcome"
            >

                <div class="welcome-icon">
                    ✦
                </div>

                <h2>
                    How can I help you study?
                </h2>

                <p>
                    Ask me about concepts, problems,
                    notes, revision or exam preparation.
                </p>

                <div class="suggestions">

                    <button
                        class="suggestion-btn"
                        data-message="Explain Kirchhoff's Voltage Law in very simple language."
                    >
                        Explain a concept
                    </button>

                    <button
                        class="suggestion-btn"
                        data-message="Create a simple 7-day study plan for Engineering Mathematics."
                    >
                        Create a study plan
                    </button>

                    <button
                        class="suggestion-btn"
                        data-message="Quiz me on basic physics concepts."
                    >
                        Start a quiz
                    </button>

                </div>

            </div>
        `;


        input.value = "";

        input.style.height =
            "auto";


        attachSuggestionEvents();

        input.focus();

    }
);


// =========================================================
// SUGGESTION BUTTONS
// =========================================================

function attachSuggestionEvents() {

    const buttons =
        document.querySelectorAll(
            ".suggestion-btn"
        );


    buttons.forEach(
        (button) => {

            button.addEventListener(
                "click",
                () => {

                    input.value =
                        button.dataset.message;


                    input.style.height =
                        "auto";


                    input.style.height =
                        `${Math.min(
                            input.scrollHeight,
                            150
                        )}px`;


                    sendMessage();

                }
            );

        }
    );

}