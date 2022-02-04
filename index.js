const { Plugin } = require("powercord/entities");
const {
    getModule,
    constants: { Endpoints, MessageTypes },
    channels,
} = require("powercord/webpack");
const { post, get } = require("powercord/http");
const { createBotMessage } = getModule(["createBotMessage"], false);

// Made by Wolfhound905#1234

module.exports = class tiktokLink extends Plugin {
    async startPlugin() {
        this.createRequest = await getModule(
            (m) => typeof m === "function" && m.post
        );
        powercord.api.commands.registerCommand({
            command: "tiktok",
            description:
            "Give a tiktok link and then it will be sent as a video.",
            usage: "{c} <tiktok link>",
            executor: (userInput) => {
                return this.getTikTok(userInput);
            },
        });
    }
    
    pluginWillUnload() {
        powercord.api.commands.unregisterCommand("tiktok");
    }
    
    async getTikTok(userInput) {
        
        // -----snapsave.app---------------------------------------------------------
        let boundary = "----WebKitFormBoundary" + Math.random().toString(16);
        let formData =
            `--${boundary}\r\nContent-Disposition: form-data; name="url"\n\n` +
            userInput +
            `\n${boundary}--\r\n`;

        console.log(formData);

        let whatever = await post("https://snapsave.app/action.php")
            .set("Referer", "https://snapsave.app/")
            .set("Content-Type", `multipart/form-data; boundary=${boundary}`)
            .send(formData);

        let regex = /src="(.*)"/gm;
        let msg_response;
        let m;
        let tiktok_link;

        while ((m = regex.exec(whatever.body.data)) !== null) {
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }
            m.forEach((match, groupIndex) => {
                try {
                    let link = new URL(match);
                    console.log(link);
                    if (link.hostname.includes("tiktokcdn.com")) {
                        tiktok_link = match;
                    }
                    return;
                } catch {}
            });
        }
        // -----------------------------------------------------------------------



        // -----tikdown.org--------------------------------------------------------
        // let whatever = await post(`https://tikdown.org/getAjax?url=${encodeURI(userInput)}`)

        // let regex = /href="(.*mp4)"/gm;
        // let m;
        // let tiktok_link;
        // let msg_response;

        // let html = JSON.parse(new Buffer(whatever.body).toString())

        // while ((m = regex.exec(html.html)) !== null) {
        //     if (m.index === regex.lastIndex) {
        //         regex.lastIndex++;
        //     }
        //     m.forEach((match, groupIndex) => {
        //         console.log(match);
        //         try {
        //             let link = new URL(match);
        //             if (link.hostname.includes("tikdown.org")) {
        //                 if (link.searchParams.get("filename").includes(".mp4")) {
        //                     tiktok_link = link.toString();
        //                 }
        //             }
        //             return;
        //         } catch {}
        //     });
        // }
        // -----------------------------------------------------------------------




        
        if (tiktok_link) {
            msg_response = "Your video is being sent now! (This will depend on upload speed)";
            const channel = Endpoints.MESSAGES(channels.getChannelId())
            const video = await get(tiktok_link);

            console.log(video.body);
            console.log(this.createRequest);

            try {
                const request = this.createRequest.post(channel);
                const formData = request._getFormData();

                let url = new URL(userInput);
                let params = new URLSearchParams(url.search);
                for (let param of params) {
                    url.searchParams.delete(param[0]);
                }

                let video_name =
                    url.pathname.split("/")[1] +
                    "_" +
                    url.pathname.split("/")[3];

                const message = createBotMessage(
                    channels.getChannelId(),
                    `Link: <${url.toString()}>`,
                    false,
                    MessageTypes.DEFAULT,
                    false,
                    false
                );

                formData.set("payload_json", JSON.stringify(message));

                formData.set(
                    "file",
                    new File([video.body], `${video_name}.mp4`)
                );

                request.end();
            } catch (e) {
                console.error(e);
            }
        } else {
            if (whatever.body.error) {
                switch (whatever.body.shortName) {
                    case "error_url":
                        msg_response = "Error: Invalid URL";
                        break;
                    case "error_url_support":
                        msg_response = "Error: This URL is not supported";
                        break;
                    default:
                        msg_response =
                            "Something went wrong, please try again.";
                        break;
                }
            }
            console.log(whatever.body);
        }

        return {
            send: false,
            result: `${msg_response}`,
        };
    }
};
