const axios = require("axios");

module.exports = async function (context, req) {
    const AZURE_OCR_ENDPOINT = process.env["VISION_URL"];
    const AZURE_API_KEY = process.env["VISION_KEY"];

    // 🔐 Allow only your frontend
    const referer = req.headers['referer'] || "";
    const allowedOrigins = [
        "https://your-site-name.azurestaticapps.net", // 🔁 UPDATE with your actual URL
        "https://your-custom-domain.com"              // Optional: custom domain
    ];

    const isAllowed = allowedOrigins.some(origin => referer.startsWith(origin));
    if (!isAllowed) {
        context.res = {
            status: 403,
            body: "Access denied: requests must come from the official site."
        };
        return;
    }

    try {
        if (!req.body || req.body.length === 0) {
            context.res = {
                status: 400,
                body: "No image data received."
            };
            return;
        }

        // Decode base64 image
        const imageBuffer = Buffer.from(req.body.image.split(",")[1], 'base64');

        // Submit to Azure OCR (async version)
        const response = await axios.post(
            `${AZURE_OCR_ENDPOINT}/vision/v3.2/read/analyze`,
            imageBuffer,
            {
                headers: {
                    "Ocp-Apim-Subscription-Key": AZURE_API_KEY,
                    "Content-Type": "application/octet-stream"
                }
            }
        );

        const operationUrl = response.headers["operation-location"];
        await new Promise(resolve => setTimeout(resolve, 5000));

        const resultResponse = await axios.get(operationUrl, {
            headers: {
                "Ocp-Apim-Subscription-Key": AZURE_API_KEY
            }
        });

        context.res = {
            status: 200,
            body: resultResponse.data.analyzeResult
        };
    } catch (error) {
        context.res = {
            status: 500,
            body: "Error: " + error.message
        };
    }
};
