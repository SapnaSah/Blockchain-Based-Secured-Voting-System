
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export async function setup2FA(req, res) {
  const secret = speakeasy.generateSecret();
  const qrcode = await QRCode.toDataURL(secret.otpauth_url);
  return res.json({ secret: secret.base32, qrcode });
}

export async function verify2FA(req, res) {
  const { token, secret } = req.body;
  const verified = speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token
  });
  return res.json({ verified });
}
