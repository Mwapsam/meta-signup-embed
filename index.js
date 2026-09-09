
    /*
     * ============================================================
     * STATE
     * ============================================================
     */

    let whatsappSession = {
        wabaId: null,
        phoneNumberId: null,
        businessId: null
    };

    let authorizationCode = null;


    /*
     * ============================================================
     * HELPER: LOG TO PAGE + CONSOLE
     * ============================================================
     */

    function logEvent(title, data) {

        // Always log to browser console
        console.group(title);
        console.log(data);
        console.groupEnd();


        // Also display on page
        const eventLog = document.getElementById("eventLog");

        // Remove empty message
        const empty = eventLog.querySelector(".empty");

        if (empty) {
            empty.remove();
        }

        const entry = document.createElement("div");
        entry.className = "log-entry";

        const time = new Date().toLocaleTimeString();

        entry.innerHTML = `
            <div class="log-time">
                ${time}
            </div>

            <strong>${title}</strong>

            <pre>${escapeHtml(
                JSON.stringify(data, null, 2)
            )}</pre>
        `;

        eventLog.prepend(entry);
    }


    /*
     * Escape HTML before putting JSON into innerHTML
     */

    function escapeHtml(value) {

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    /*
     * ============================================================
     * MESSAGE EVENT
     *
     * Facebook Embedded Signup sends session information
     * through window.postMessage().
     * ============================================================
     */

    window.addEventListener("message", function (event) {

        console.group("WHATSAPP EMBEDDED SIGNUP - MESSAGE EVENT");

        console.log("Origin:", event.origin);
        console.log("Source:", event.source);
        console.log("Data:", event.data);
        console.log("Data Type:", typeof event.data);
        console.log("Last Event ID:", event.lastEventId);
        console.log("Ports:", event.ports);
        console.log("Full Event:", event);

        console.groupEnd();


        /*
         * Log EVERYTHING we received.
         */

        const eventData = {
            origin: event.origin,
            data: event.data,
            dataType: typeof event.data,
            lastEventId: event.lastEventId,
            ports: event.ports,
            timestamp: new Date().toISOString()
        };

        logEvent(
            "MessageEvent received",
            eventData
        );


        /*
         * The Embedded Signup session information
         * is normally inside event.data.
         */

        let data = event.data;


        /*
         * Sometimes data may arrive as a JSON string.
         */

        if (typeof data === "string") {

            try {
                data = JSON.parse(data);

                console.log(
                    "Parsed event.data:",
                    data
                );

            } catch (error) {

                console.log(
                    "event.data is not JSON:",
                    data
                );
            }
        }


        /*
         * Display raw session data.
         */

        document.getElementById("sessionData").textContent =
            JSON.stringify(data, null, 2);


        /*
         * ========================================================
         * EXTRACT WHATSAPP IDs
         * ========================================================
         *
         * Depending on the Embedded Signup version/configuration,
         * Facebook may return these values under different
         * property names.
         */

        if (data && typeof data === "object") {

            console.log(
                "Attempting to extract WhatsApp session IDs..."
            );


            /*
             * Common structures
             */

            const wabaId =
                data.waba_id ||
                data.wabaId ||
                data.waba?.id ||
                data.data?.waba_id ||
                data.data?.wabaId ||
                data.data?.waba?.id ||
                null;


            const phoneNumberId =
                data.phone_number_id ||
                data.phoneNumberId ||
                data.phone?.id ||
                data.data?.phone_number_id ||
                data.data?.phoneNumberId ||
                data.data?.phone?.id ||
                null;


            const businessId =
                data.business_id ||
                data.businessId ||
                data.business?.id ||
                data.data?.business_id ||
                data.data?.businessId ||
                data.data?.business?.id ||
                null;


            /*
             * Store locally.
             */

            if (wabaId) {

                whatsappSession.wabaId = wabaId;

                document.getElementById("wabaId").textContent =
                    wabaId;
            }


            if (phoneNumberId) {

                whatsappSession.phoneNumberId =
                    phoneNumberId;

                document.getElementById("phoneNumberId").textContent =
                    phoneNumberId;
            }


            if (businessId) {

                whatsappSession.businessId =
                    businessId;

                document.getElementById("businessId").textContent =
                    businessId;
            }


            /*
             * Log extracted information.
             */

            logEvent(
                "Extracted WhatsApp Session",
                whatsappSession
            );


            /*
             * Store in browser localStorage.
             */

            localStorage.setItem(
                "whatsapp_embedded_signup",
                JSON.stringify(whatsappSession)
            );


            console.log(
                "Saved WhatsApp session to localStorage:",
                whatsappSession
            );


            /*
             * Update status.
             */

            if (
                whatsappSession.wabaId ||
                whatsappSession.phoneNumberId
            ) {

                setStatus(
                    "WhatsApp session information received.",
                    "success"
                );

            }

        }

    });


    /*
     * ============================================================
     * FACEBOOK LOGIN CALLBACK
     * ============================================================
     */

    function fbLoginCallback(response) {

        console.group(
            "FACEBOOK LOGIN CALLBACK"
        );

        console.log(
            "Full Facebook Login Response:",
            response
        );

        console.log(
            "Auth Response:",
            response.authResponse
        );

        console.groupEnd();


        /*
         * Log the complete response.
         */

        document.getElementById(
            "loginResponse"
        ).textContent =
            JSON.stringify(response, null, 2);


        logEvent(
            "Facebook Login Callback",
            response
        );


        /*
         * Check authentication response.
         */

        if (response.authResponse) {

            authorizationCode =
                response.authResponse.code;


            /*
             * Display the code.
             */

            document.getElementById(
                "authCode"
            ).textContent =
                authorizationCode || "No code returned";


            /*
             * Log it.
             */

            console.log(
                "Authorization Code:",
                authorizationCode
            );


            /*
             * Log current WhatsApp session.
             */

            console.log(
                "WhatsApp Session:",
                whatsappSession
            );


            /*
             * Save locally for debugging.
             */

            localStorage.setItem(
                "whatsapp_auth_code",
                authorizationCode
            );


            /*
             * At this point send EVERYTHING
             * to your backend.
             */

            const payload = {

                code: authorizationCode,

                waba_id:
                    whatsappSession.wabaId,

                phone_number_id:
                    whatsappSession.phoneNumberId,

                business_id:
                    whatsappSession.businessId,

                facebook_response:
                    response,

                whatsapp_session:
                    whatsappSession
            };


            console.log(
                "PAYLOAD TO SEND TO BACKEND:",
                payload
            );


            /*
             * Display payload in console.
             */

            logEvent(
                "Backend Payload",
                payload
            );


            /*
             * ====================================================
             * SEND TO YOUR BACKEND
             * ====================================================
             *
             * Uncomment and change the URL to your endpoint.
             */

            /*
            fetch("/api/whatsapp/embedded-signup/", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(payload)

            })
            .then(response => response.json())

            .then(data => {

                console.log(
                    "Backend response:",
                    data
                );

                logEvent(
                    "Backend Response",
                    data
                );

            })

            .catch(error => {

                console.error(
                    "Backend error:",
                    error
                );

                logEvent(
                    "Backend Error",
                    {
                        error: error.message
                    }
                );

            });
            */


            setStatus(
                "Facebook authentication successful. Authorization code received.",
                "success"
            );


        } else {

            console.error(
                "Facebook Login failed or was cancelled.",
                response
            );


            setStatus(
                "Facebook Login failed or was cancelled.",
                "error"
            );
        }

    }


    /*
     * ============================================================
     * LAUNCH WHATSAPP SIGNUP
     * ============================================================
     */

    function launchWhatsAppSignup() {

        console.log(
            "Launching WhatsApp Embedded Signup..."
        );


        /*
         * Check if Facebook SDK has loaded.
         */

        if (typeof FB === "undefined") {

            console.error(
                "Facebook SDK has not loaded yet."
            );

            setStatus(
                "Facebook SDK has not loaded yet. Please try again.",
                "error"
            );

            return;
        }


        /*
         * Clear previous state.
         */

        authorizationCode = null;

        whatsappSession = {
            wabaId: null,
            phoneNumberId: null,
            businessId: null
        };


        /*
         * Launch Facebook Login.
         */

        FB.login(
            fbLoginCallback,
            {
                config_id: "849603518211599",

                response_type: "code",

                override_default_response_type: true,

                extras: {
                    version: "v4"
                }
            }
        );

    }


    /*
     * ============================================================
     * STATUS
     * ============================================================
     */

    function setStatus(message, type = "") {

        const status =
            document.getElementById("status");

        status.textContent = message;

        status.className =
            "status " + type;
    }


    /*
     * ============================================================
     * FACEBOOK SDK INITIALIZATION
     * ============================================================
     */

    window.fbAsyncInit = function () {

        console.log(
            "Initializing Facebook SDK..."
        );


        FB.init({

            /*
             * Replace this with your Facebook App ID.
             */

            appId: "4509209859314632",

            cookie: true,

            xfbml: true,

            version: "v26.0"

        });


        console.log(
            "Facebook SDK initialized."
        );


        setStatus(
            "Facebook SDK loaded. Ready to connect WhatsApp.",
            "success"
        );


        /*
         * Optional: log SDK initialization.
         */

        logEvent(
            "Facebook SDK Initialized",
            {
                appId: "YOUR_FACEBOOK_APP_ID",
                version: "v24.0",
                timestamp: new Date().toISOString()
            }
        );

    };


    /*
     * ============================================================
     * LOAD FACEBOOK SDK
     * ============================================================
     */

    (function (d, s, id) {

        let js;
        const fjs = d.getElementsByTagName(s)[0];

        if (d.getElementById(id)) {
            return;
        }

        js = d.createElement(s);

        js.id = id;

        js.src =
            "https://connect.facebook.net/en_US/sdk.js";

        js.async = true;
        js.defer = true;
        js.crossOrigin = "anonymous";

        fjs.parentNode.insertBefore(
            js,
            fjs
        );

    }(
        document,
        "script",
        "facebook-jssdk"
    ));


    /*
     * ============================================================
     * RESTORE PREVIOUS SESSION FOR DEBUGGING
     * ============================================================
     */

    window.addEventListener(
        "DOMContentLoaded",
        function () {

            const savedSession =
                localStorage.getItem(
                    "whatsapp_embedded_signup"
                );

            const savedCode =
                localStorage.getItem(
                    "whatsapp_auth_code"
                );


            if (savedSession) {

                try {

                    whatsappSession =
                        JSON.parse(savedSession);


                    document.getElementById(
                        "wabaId"
                    ).textContent =
                        whatsappSession.wabaId ||
                        "Not received";


                    document.getElementById(
                        "phoneNumberId"
                    ).textContent =
                        whatsappSession.phoneNumberId ||
                        "Not received";


                    document.getElementById(
                        "businessId"
                    ).textContent =
                        whatsappSession.businessId ||
                        "Not received";


                    console.log(
                        "Restored WhatsApp session:",
                        whatsappSession
                    );

                } catch (error) {

                    console.error(
                        "Could not restore WhatsApp session:",
                        error
                    );

                }

            }


            if (savedCode) {

                authorizationCode =
                    savedCode;


                document.getElementById(
                    "authCode"
                ).textContent =
                    savedCode;

            }

        }
    );
