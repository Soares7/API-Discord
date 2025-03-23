require("dotenv").config();
const axios = require("axios");
const qs = require("querystring");

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const redirectUri = process.env.REDIRECT_URI || "http://localhost:3000/callback";

app.get("/login", (req, res) => {
  const authUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify+guilds`;
  console.log("Redirecionando para URL de autenticação:", authUrl);
  res.redirect(authUrl);
});

app.get("/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).json({ error: "Código de autorização não encontrado." });
  }

  try {
    const tokenResponse = await axios.post(
      "https://discord.com/api/oauth2/token",
      qs.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        scope: "identify",
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const accessToken = tokenResponse.data.access_token;
    if (!accessToken) {
      throw new Error("Token de acesso não recebido.");
    }

    const userResponse = await axios.get("https://discord.com/api/v10/users/@me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const userData = userResponse.data;
    console.log("Dados completos do usuário:", userData);
    console.log("Flags públicas do usuário (public_flags):", userData.public_flags);
    console.log("Tipo de Nitro do usuário (premium_type):", userData.premium_type);

    const userFlags = userData.public_flags || 0;
    const badgesData = getBadges(userFlags);

    const avatarUrl = userData.avatar
      ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`
      : "https://cdn.discordapp.com/embed/avatars/0.png";

    userSession = {
      username: userData.username,
      global_name: userData.global_name || userData.username,
      avatar: avatarUrl,
      badges: badgesData,
      nitroStatus: userData.premium_type || 2, 
    };

    res.redirect("/profile");
  } catch (error) {
    console.error("Erro ao autenticar no Discord:", error.response?.data || error.message);
    res.status(500).json({ error: "Erro ao obter os dados do usuário." });
  }
});
