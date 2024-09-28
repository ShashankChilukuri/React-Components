const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const ejs = require('ejs'); 
const path = require('path');
const { PassThrough } = require('stream');
const PDFDocument = require('pdfkit');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json()); 

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); 

const generatePDFInMemory = (username) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const stream = new PassThrough(); 
    const buffers = [];

    doc.pipe(stream);
    doc.fontSize(25).text(`Hello ${username}!`, 100, 100)
       .fontSize(14).text('This is a sample PDF file generated dynamically using PDFKit.');

    doc.end();

    stream.on('data', chunk => buffers.push(chunk));
    stream.on('end', () => {
      const pdfData = Buffer.concat(buffers); 
      resolve(pdfData); 
    });

    stream.on('error', (error) => {
      reject(error);
    });
  });
};

app.post('/send-email', async (req, res) => {
  const { to, username } = req.body; 

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'prabhas05112004@gmail.com',
      pass: 'xvwx hsvr lpuw ayyc', 
    },
  });

  ejs.renderFile(path.join(__dirname, 'views', 'signup-email.ejs'), { username: username }, async (err, emailHtml) => {
    if (err) {
      console.error('EJS Render Error:', err);
      return res.status(500).json({ error: 'Error rendering email template.' });
    }

    try {
      const pdfData = await generatePDFInMemory(username);

      const mailOptions = {
        from: 'Shashank Chilukuri', 
        to: to,                     
        subject: 'Successful Sign-Up',
        html: emailHtml,
        attachments: [
          {
            filename: 'Certificate.pdf', 
            path: path.join(__dirname, 'attachments', 'Certificate.pdf'), 
          },
          {
            filename: `${username}.pdf`, 
            content: pdfData,            
            contentType: 'application/pdf'
          }
        ]
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent: ' + info.response);
      res.status(200).json({ message: 'Email sent successfully!' });
      
    } catch (error) {
      console.error('Error generating PDF or sending email:', error);
      res.status(500).json({ error: 'Failed to send email with PDF.' });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
