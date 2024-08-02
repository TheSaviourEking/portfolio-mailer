import express, { Request, Response } from "express";
import nodemailer from 'nodemailer';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 8000

const app = express();

// Enable CORS with default settings (allow all origins)
// app.use(cors());

// Alternatively, you can specify more detailed CORS settings if needed
app.use(cors({
  origin: 'http://localhost:3000', // replace with your frontend URL
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204
}));

// Middleware for logging requests, excluding OPTIONS requests
// morgan.token('status', (req, res) => {
//   if (req.method === 'OPTIONS') {
//     return undefined;
//   }
//   return res.statusCode.toString();
// });
// app.use(morgan(':method :url :status :res[content-length] - :response-time ms', {
//   skip: (req) => req.method === 'OPTIONS'
// }));

app.use(morgan('dev'));

// Middleware for parsing JSON bodies
app.use(express.json());

// Middleware for parsing URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

app.get('/', (req: Request, res: Response) => {
    res.json({ hello: 'heooooooooooooooooo' });
});

app.post('/sendmail', async (req: Request, res: Response) => {
    try {
        const { name, email, message } = req.body;

        // Check if necessary environment variables are set
        if (!process.env.GMAIL_EMAIL || !process.env.GMAIL_PASSWORD || !process.env.OUTLOOK_EMAIL) {
            return res.status(500).json({ message: 'Email configuration is not set up correctly' });
        }

        // Validate input
        if (!name || !email || !message) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Create a transporter using Gmail SMTP
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                type: 'OAuth2',
                user: process.env.GMAIL_EMAIL,
                clientId: process.env.CLIENT_ID,
                clientSecret: process.env.CLIENT_SECRET,
                refreshToken: process.env.REFRESH_TOKEN,
            },
        });

        // Send email
        await transporter.sendMail({
            from: `"Portfolio Website Contact" <${process.env.GMAIL_EMAIL}>`,
            replyTo: email,
            to: process.env.OUTLOOK_EMAIL,
            subject: `New Inquiry from ${name} via Contact Form`,
            text: `
                New Contact Form Submission

                Name: ${name}
                Email: ${email}

                Message:
                ${message}

                --
                This email was sent from the contact form on the Portfolio website.
            `,
            html: `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>New Contact Form Submission</title>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background-color: #f4f4f4; padding: 10px; text-align: center; }
                        .content { padding: 20px 0; }
                        .footer { font-size: 0.8em; text-align: center; margin-top: 20px; color: #777; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2>New Contact Form Submission</h2>
                        </div>
                        <div class="content">
                            <p>Dear Saviour,</p>
                            <p>A new inquiry has been submitted through the contact form on the Portfolio website. Details are as follows:</p>
                            <p><strong>Name:</strong> ${name}</p>
                            <p><strong>Email:</strong> ${email}</p>
                            <h3>Message:</h3>
                            <p>${message.replace(/\n/g, '<br>')}</p>
                            <p>Please respond to this inquiry at your earliest convenience.</p>
                        </div>
                        <div class="footer">
                            <p>This is an automated message from the Portfolio website contact form. Please do not reply directly to this email.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
        });

        return res.status(200).json({ message: 'Email sent successfully' });
    } catch (error) {
        console.error('Error sending email:', error);
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }
        return res.status(500).json({ message: 'Error sending email', error: error instanceof Error ? error.message : String(error) });
    }
});

app.listen(PORT, () => {
    console.log('Listening on port ', PORT);
});
