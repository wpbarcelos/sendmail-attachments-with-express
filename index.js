require("dotenv").config();

const express = require("express");
const multer = require("multer");
const nodemailer = require("nodemailer");
const fs = require("fs").promises;

const path = require("path");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        console.log({ file });
        cb(
            null,
            file.fieldname + "_" + Date.now() + path.extname(file.originalname)
        );
    },
});

var upload = multer({ storage: storage });

const mail = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASS,
    },
});
app.use(express.static("public"));
app.post("/sendmail", upload.array("arquivos"), (req, res) => {
    if (req.files.length === 0) {
        return res
            .status(400)
            .json({ err: "anexos [arquivos] são obrigatórios" });
    }
    if (!req.body.nome) {
        return res.status(400).json({ err: "o campo [nome] é obrigatório" });
    }

    if (!req.body.email) {
        return res.status(400).json({ err: "o campo [email] é obrigatório" });
    }

    if (!req.body.assunto) {
        return res.status(400).json({ err: "o campo [assunto] é obrigatório" });
    }

    const attachments = req.files.map(({ path, filename }) => ({
        path,
        filename,
    }));

    const { nome, email, telefone } = req.body;

    const mailOptions = {
        from: process.env.EMAIL,
        to: process.env.EMAIL,
        cc: email,
        subject: `Email app siqueira`,
        html: `<p>Você recebeu uma nova mensagem enviado pelo aplicativo.</p>
        <p><strong>Nome:</strong> ${nome}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Telefone:</strong> ${telefone}</p>
        <p>Segue documentos em anexo<p>`,
    };

    mail.sendMail({ ...mailOptions, attachments }, function (err, info) {
        req.files.map((file) => {
            fs.unlink(file.path);
        });

        if (err) {
            res.send({ err });
        } else {
            res.send(`
            <!DOCTYPE html>
                <html lang="pt-br">
                    <head>
                        <meta charset="UTF-8" />
                        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
                        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <body style="font-size: 20px;margin:0;font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                <div style="flex-direction:column; color: white; width: 100%; height: 100vh; display:flex; align-items: center; justify-content: center; background:#000">
                    <p style='color:white'>
                        Email enviado com sucesso!
                    </p>
                    <a href="/form.html" style='text-decoration:none; color:white; margin-top: 50px;padding:10px; border:1px solid #fff;border-radius:3px;'>
                        Enviar outro email
                    </a>
                </div>
            </body>
            </html>
            `);
        }
    });
});

app.listen(3000, () => {
    console.log("Servidor rodando na porta 3000...");
});
