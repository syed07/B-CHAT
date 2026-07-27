document.addEventListener("DOMContentLoaded", () => {
    const welcomeScreen = document.getElementById("welcomeScreen");
    const app = document.getElementById("app");
    const usernameInput = document.getElementById("usernameInput");
    const continueBtn = document.getElementById("continueBtn");
    const displayName = document.getElementById("displayName");

    const chatForm = document.getElementById("chatForm");
    const messageInput = document.getElementById("messageInput");
    const messagesContainer = document.getElementById("messages");
    const typingIndicator = document.getElementById("typingIndicator");
    const mouseGlow = document.getElementById("mouseGlow");

    const attachBtn = document.getElementById("attachBtn");
    const voiceBtn = document.getElementById("voiceBtn");

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.style.display = "none";
    fileInput.multiple = true;
    fileInput.accept = "image/*,application/pdf,.txt,.doc,.docx";
    document.body.appendChild(fileInput);

    let username = localStorage.getItem("b_chat_username") || "";
    let conversationHistory = [];
    let attachedFiles = [];

    if (username) {
        welcomeScreen.classList.add("hidden");
        app.classList.remove("hidden");
        displayName.textContent = username;
    }

    function handleLogin() {
        const val = usernameInput.value.trim();
        if (!val) {
            usernameInput.focus();
            return;
        }

        username = val;
        localStorage.setItem("b_chat_username", username);

        welcomeScreen.style.opacity = "0";
        welcomeScreen.style.transition = "opacity 0.4s ease";
        setTimeout(() => {
            welcomeScreen.classList.add("hidden");
            app.classList.remove("hidden");
            displayName.textContent = username;
            messageInput.focus();
        }, 400);
    }

    if (continueBtn) {
        continueBtn.addEventListener("click", handleLogin);
    }

    if (usernameInput) {
        usernameInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                handleLogin();
            }
        });
    }

    document.addEventListener("mousemove", (e) => {
        if (mouseGlow) {
            mouseGlow.style.left = `${e.clientX}px`;
            mouseGlow.style.top = `${e.clientY}px`;
        }
    });

    messageInput.addEventListener("input", () => {
        messageInput.style.height = "auto";
        messageInput.style.height = `${Math.min(messageInput.scrollHeight, 150)}px`;
    });

    messageInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            chatForm.requestSubmit();
        }
    });

    if (attachBtn) {
        attachBtn.addEventListener("click", () => fileInput.click());
        fileInput.addEventListener("change", (e) => {
            const files = Array.from(e.target.files);
            if (files.length > 0) {
                attachedFiles = files;
                attachBtn.style.color = "#00ff88";
                attachBtn.title = `${files.length} file(s) attached`;
            }
        });
    }

    let recognition = null;
    let isRecording = false;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (voiceBtn) {
        if (SpeechRecognition) {
            recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = "en-US";

            voiceBtn.addEventListener("click", () => {
                if (!isRecording) {
                    try { recognition.start(); } catch (err) { console.error(err); }
                } else {
                    recognition.stop();
                }
            });

            recognition.onstart = () => {
                isRecording = true;
                voiceBtn.classList.add("recording");
                voiceBtn.style.color = "#ff4d4d";
                messageInput.placeholder = "Listening...";
            };

            recognition.onresult = (event) => {
                let transcript = "";
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    transcript += event.results[i][0].transcript;
                }
                messageInput.value = transcript;
                messageInput.style.height = "auto";
                messageInput.style.height = `${messageInput.scrollHeight}px`;
            };

            recognition.onerror = () => stopRecordingState();
            recognition.onend = () => stopRecordingState();
        } else {
            voiceBtn.addEventListener("click", () => alert("Speech recognition is not supported in this browser. Please use Chrome or Edge."));
        }
    }

    function stopRecordingState() {
        isRecording = false;
        if (voiceBtn) {
            voiceBtn.classList.remove("recording");
            voiceBtn.style.color = "";
        }
        if (messageInput) messageInput.placeholder = "Message B-Chat...";
    }

    chatForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const text = messageInput.value.trim();
        if (!text && attachedFiles.length === 0) return;

        let displayMessage = text;
        if (attachedFiles.length > 0) {
            const fileNames = attachedFiles.map(f => f.name).join(", ");
            displayMessage += `\n\n*(Attached files: ${fileNames})*`;
        }

        appendMessage(displayMessage, "user");
        conversationHistory.push({ role: "user", content: displayMessage });

        messageInput.value = "";
        messageInput.style.height = "auto";
        attachedFiles = [];
        if (attachBtn) attachBtn.style.color = "";

        if (typingIndicator) typingIndicator.classList.remove("hidden");
        scrollToBottom();

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: conversationHistory })
            });

            const data = await res.json();
            if (typingIndicator) typingIndicator.classList.add("hidden");

            if (res.ok && data.text) {
                appendMessage(data.text, "ai");
                conversationHistory.push({ role: "assistant", content: data.text });
            } else {
                appendMessage(data.error || "Network error.", "ai");
            }
        } catch (err) {
            if (typingIndicator) typingIndicator.classList.add("hidden");
            appendMessage("Network error. Please make sure the backend server is running.", "ai");
        }
    });

    function appendMessage(text, sender) {
        const messageRow = document.createElement("div");
        messageRow.className = `message ${sender}`;

        if (sender === "ai") {
            const avatar = document.createElement("div");
            avatar.className = "avatar";
            avatar.textContent = "B";
            messageRow.appendChild(avatar);
        }

        const bubble = document.createElement("div");
        bubble.className = "bubble";

        if (sender === "ai") {
            if (window.marked) {
                marked.setOptions({
                    highlight: function (code, lang) {
                        if (window.hljs && lang && hljs.getLanguage(lang)) {
                            return hljs.highlight(code, { language: lang }).value;
                        }
                        return window.hljs ? hljs.highlightAuto(code).value : code;
                    }
                });
                bubble.innerHTML = marked.parse(text);
            } else {
                bubble.textContent = text;
            }
        } else {
            bubble.textContent = text;
        }

        messageRow.appendChild(bubble);
        messagesContainer.appendChild(messageRow);
        scrollToBottom();
    }

    function scrollToBottom() {
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    const newChatBtn = document.getElementById("newChatBtn");
    if (newChatBtn) {
        newChatBtn.addEventListener("click", () => {
            conversationHistory = [];
            messagesContainer.innerHTML = "";
        });
    }
});