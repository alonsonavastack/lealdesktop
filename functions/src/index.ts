import * as functions from 'firebase-functions';
import * as nodemailer from 'nodemailer';

export const sendPasswordResetEmail = functions.https.onCall(async (data, context) => {
  const { email, password, userName } = data;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Tu nueva contraseña - Leal',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Hola ${userName},</h2>
        <p>Has solicitado restablecer tu contraseña. Tu nueva contraseña es:</p>
        <div style="background-color: #f5f5f5; padding: 10px; margin: 15px 0; font-family: monospace;">
          ${password}
        </div>
        <p>Por seguridad, te recomendamos cambiar esta contraseña una vez que inicies sesión.</p>
        <p>Si no solicitaste este cambio, por favor contacta con soporte inmediatamente.</p>
        <br>
        <p>Saludos,<br>Equipo Leal</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    throw new functions.https.HttpsError('internal', 'Error al enviar el correo');
  }
});