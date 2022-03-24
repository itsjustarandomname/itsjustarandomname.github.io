import EventTargetMixin from '../util/eventtarget.js';

export default class Clipboard extends EventTargetMixin {
    constructor() {
        super();
        this._isClipboardAPIAvailable = false;
        this._isGrabbed = false;
        this._isWritingClipboard = false;
        this._isFocused = false;
        this._clipboardText = "";
        if (typeof(navigator.clipboard) !== "undefined") {
            this._isClipboardAPIAvailable = true;
        }
        this._eventHandlers = {
            "focus": this._handleFocus.bind(this),
            "blur": this._handleBlur.bind(this),
        };
    }

    async _checkClipboard() {
        try {
            const text = await navigator.clipboard.readText();
            if (text !== this._clipboardText && !this._isWritingClipboard) {
                this.dispatchEvent(new CustomEvent("clipboardupdate", {
                    detail: { type: "text", data: text }
                }));
                this._clipboardText = text;
            }
        } catch (err) {
            this.ungrab();
            this._isClipboardAPIAvailable = false;
            this.dispatchEvent(new CustomEvent("clipboardapifail"));
        }
    }

    _handleFocus() {
        // we check the clipboard when the window is focused
        this._isFocused = true;
        this._checkClipboard();
    }

    _handleBlur() {
        this._isFocused = false;
    }

    get available() {
        return this._isClipboardAPIAvailable;
    }

    async write(type, data) {
        if (!this._isClipboardAPIAvailable || !this._isGrabbed || !this._isFocused || this._isWritingClipboard) {
            return;
        }
        if (type === "text") {
            this._isWritingClipboard = true;
            try {
                await navigator.clipboard.writeText(data);
            } catch (err) {
                this.ungrab();
                this._isClipboardAPIAvailable = false;
                this.dispatchEvent(new CustomEvent("clipboardapifail"));
            }
            //this._clipboardText = data;
            this._isWritingClipboard = false;
        }
    }

    grab() {
        if (this._isGrabbed) {
            return;
        }
        this._isGrabbed = true;
        if (document.hasFocus) {
            this._isFocused = true;
            this._checkClipboard();
        }
        window.addEventListener("focus", this._eventHandlers.focus);
        window.addEventListener("blur", this._eventHandlers.blur);
    }

    ungrab() {
        if (!this._isClipboardAPIAvailable || !this._isGrabbed) {
            return;
        }
        this._isGrabbed = false;
        window.removeEventListener("focus", this._eventHandlers.focus);
        window.removeEventListener("blur", this._eventHandlers.blur);
    }

};