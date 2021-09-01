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

    const { nome, email, assunto } = req.body;

    const mailOptions = {
        from: process.env.EMAIL,
        to: "wpbarcelos@gmail.com",
        cc: email,
        subject: `Email app siqueira: ${assunto}`,
        html: `<p>Nova mensagem enviado pelo aplicativo.</p>
        <p><strong>Nome:</strong> ${nome}</p>
        <p><strong>Assunto:</strong> ${assunto}</p>
        <p>Segue documentos em anexo<p>`,
    };

    mail.sendMail({ ...mailOptions, attachments }, function (err, info) {
        req.files.map((file) => {
            fs.unlink(file.path);
        });

        if (err) {
            res.send({ err });
        } else {
            res.send({ message: "Email enviado com sucesso" });
        }
    });
});

app.listen(3000, () => {
    console.log("Servidor rodando...");
});
