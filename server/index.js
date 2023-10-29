const express = require('express');
const bodyParser = require('body-parser');
const sgMail = require('@sendgrid/mail');

const app = express();

// Use body-parser middleware to parse JSON requests
app.use(bodyParser.json());

// Set SendGrid API Key
sgMail.setApiKey('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'); // replace with your API Key

app.post('/send-email', (req, res) => {
    const { email, message } = req.body;

    const msg = {
        to: email, // recipient email
        from: 'your-email@example.com', // your verified SendGrid email
        subject: 'Order Confirmation',
        text: message,
    };

    sgMail.send(msg)
        .then(() => {
            res.status(200).send({ success: true });
        })
        .catch(error => {
            console.error('Error sending email:', error);
            res.status(500).send({ success: false, error: error.message });
        });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
