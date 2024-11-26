const OAuthClient = require("intuit-oauth");
const Quickbook = require("../models/quickbookAuth");
const venderModel = require("../models/venderModel");

const oauthClient = new OAuthClient({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  environment: process.env.ENVIRONMENT,
  redirectUri: process.env.REDIRECT_URL,
});

// Utility function to refresh tokens
const refreshQuickBooksToken = async (vendorId) => {
  try {
    const existingRecord = await Quickbook.findOne({ vendorId });

    if (!existingRecord) {
      throw new Error("No QuickBooks record found for the vendor.");
    }

    oauthClient.token.setToken({
      access_token: existingRecord.accessToken,
      refresh_token: existingRecord.refreshToken,
    });

    const newToken = await oauthClient.refresh();
    const updatedToken = newToken.getJson();

    existingRecord.accessToken = updatedToken.access_token;
    existingRecord.refreshToken = updatedToken.refresh_token;
    await existingRecord.save();

    console.log(`Tokens refreshed for vendor: ${vendorId}`);
    return updatedToken.access_token;
  } catch (error) {
    console.error("Error refreshing QuickBooks token:", error);
    throw error;
  }
};

// Middleware to handle token refresh automatically
const ensureValidToken = async (req, res, next) => {
  const { vendorId } = req.body || req.query;

  if (!vendorId) {
    return res.status(400).json({ message: "Vendor ID is required." });
  }

  try {
    const existingRecord = await Quickbook.findOne({ vendorId });

    if (!existingRecord) {
      return res.status(404).json({ message: "QuickBooks record not found." });
    }

    const tokenExpirationTime = existingRecord.tokenExpirationTime || 0;
    const currentTime = Date.now();

    // Refresh the token if expired or about to expire
    if (currentTime >= tokenExpirationTime) {
      const newAccessToken = await refreshQuickBooksToken(vendorId);

      // Update OAuthClient with new token
      oauthClient.token.setToken({
        access_token: newAccessToken,
        refresh_token: existingRecord.refreshToken,
      });
    } else {
      // Set the current token in OAuthClient
      oauthClient.token.setToken({
        access_token: existingRecord.accessToken,
        refresh_token: existingRecord.refreshToken,
      });
    }

    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    res.status(500).json({ message: "Error ensuring valid token", error });
  }
};

// Existing functionality

const qucikBookAuth = async (req, res) => {
  const authUri = oauthClient.authorizeUri({
    scope: [OAuthClient.scopes.Accounting, OAuthClient.scopes.OpenId],
    state: "Init",
  });
  req.session.redirectURL = req.query.redirctURL;
  req.session.userId = req.query.vendorId;

  res.redirect(`${authUri}`);
};

const quickbookCallback = async (req, res) => {
  const parseRedirect = req.url;
  const vendorId = req.session.userId;

  try {
    const authResponse = await oauthClient.createToken(parseRedirect);

    const realmId = authResponse.token.realmId;
    const access_token = authResponse.token.access_token;
    const refresh_token = authResponse.token.refresh_token;
    const tokenExpirationTime =
      Date.now() + authResponse.token.expires_in * 1000;

    const existingRecord = await Quickbook.findOne({ vendorId });

    if (existingRecord) {
      delete req.session.userId;
      existingRecord.realmId = realmId;
      existingRecord.accessToken = access_token;
      existingRecord.refreshToken = refresh_token;
      existingRecord.tokenExpirationTime = tokenExpirationTime;
      await existingRecord.save();
    } else {
      delete req.session.userId;
      await Quickbook.create({
        vendorId,
        realmId,
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenExpirationTime,
      });
    }

    const vender = await venderModel.findById(vendorId);
    if (!vender) {
      return res.status(404).send({ error: "Vendor not found" });
    }

    vender.isQuickBook = true;
    await vender.save();

    res.redirect(req.session.redirectURL);
  } catch (error) {
    res.status(500).send("Authentication failed");
  }
};

const quickBookPayments = [
  ensureValidToken,
  async (req, res) => {
    try {
      const response = await oauthClient.makeApiCall({
        url: `https://sandbox-quickbooks.api.intuit.com/v3/company/9341452942984549/query=select * from Payment&minorversion=40>`,
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      res.json(JSON.parse(response.body));
    } catch (error) {
      console.error("Error fetching QuickBooks payments:", error);
      res.status(500).send("Failed to fetch payments");
    }
  },
];

const disconnectQuickBook = async (req, res) => {
  const { vendorId } = req.body;

  try {
    const existingRecord = await Quickbook.findOne({ vendorId });

    if (!existingRecord) {
      return res.status(404).json({ message: "QuickBooks record not found" });
    }

    await Quickbook.deleteOne({ vendorId });

    const vender = await venderModel.findById(vendorId);
    if (!vender) {
      return res.status(404).send({ error: "Vendor not found" });
    }

    vender.isQuickBook = false;
    await vender.save();

    res.status(200).json({
      message: "Successfully disconnected from QuickBooks",
      status: true,
    });
  } catch (error) {
    console.error("Error during disconnection:", error);
    res.status(500).send("Error disconnecting from QuickBooks");
  }
};

module.exports = {
  qucikBookAuth,
  quickbookCallback,
  quickBookPayments,
  disconnectQuickBook,
};

// const OAuthClient = require("intuit-oauth");
// const Quickbook = require("../models/quickbookAuth");
// const venderModel = require("../models/venderModel");
// const oauthClient = new OAuthClient({
//   clientId: process.env.CLIENT_ID,
//   clientSecret: process.env.CLIENT_SECRET,
//   environment: process.env.ENVIRONMENT,
//   redirectUri: process.env.REDIRECT_URL,
// });

// const qucikBookAuth = async (req, res) => {
//   const authUri = oauthClient.authorizeUri({
//     scope: [OAuthClient.scopes.Accounting, OAuthClient.scopes.OpenId],
//     state: "Init",
//   });
//   req.session.redirectURL = req.query.redirctURL;
//   req.session.userId = req.query.vendorId;

//   res.redirect(`${authUri}`);
// };

// const quickbookCallback = async (req, res) => {
//   const parseRedirect = req.url;

//   const vendorId = req.session.userId;
//   try {
//     const authResponse = await oauthClient.createToken(parseRedirect);

//     const realmId = authResponse.token.realmId;
//     const access_token = authResponse.token.access_token;
//     const refresh_token = authResponse.token.refresh_token;

//     // Get the vendorId from query parameters

//     const existingRecord = await Quickbook.findOne({ vendorId });

//     if (existingRecord) {
//       delete req.session.userId;
//       existingRecord.realmId = realmId;
//       existingRecord.accessToken = access_token;
//       existingRecord.refreshToken = refresh_token;
//       await existingRecord.save();
//     } else {
//       delete req.session.userId;
//       await Quickbook.create({
//         vendorId,
//         realmId,
//         accessToken: access_token,
//         refreshToken: refresh_token,
//       });
//     }
//     const vender = await venderModel.findById(vendorId);
//     if (!vender) {
//       return res.status(404).send({ error: "Vendor not found" });
//     }

//     vender.isQuickBook = true;
//     await vender.save();

//     res.redirect(
//       // "https://gohire-frontend-eqqmb.ondigitalocean.app/system-setup/integrations/quickbook"
//       // "http://localhost:3000/system-setup/integrations/quickbook"
//       req.session.redirectURL
//     );
//     // res.status(200).json({
//     //   success: true,
//     //   data: authResponse,
//     //   message: "You are connected to QuickBooks",
//     // });
//   } catch (error) {
//     res.status(500).send("Authentication failed");
//   }
// };

// const quickBookPayments = async (req, res) => {
//   try {
//     const response = await oauthClient.makeApiCall({
//       url: `https://sandbox-quickbooks.api.intuit.com/v3/company/9341452942984549/query=select * from Payment&minorversion=40>`,
//       method: "GET",
//       headers: {
//         "Content-Type": "application/json",
//       },
//     });
//     res.json(JSON.parse(response.body));
//   } catch (error) {
//     return error;
//   }
// };

// // New function to disconnect from QuickBooks
// const disconnectQuickBook = async (req, res) => {
//   const { vendorId } = req.body;

//   try {
//     // Find the existing record for the vendor
//     const existingRecord = await Quickbook.findOne({ vendorId });

//     if (!existingRecord) {
//       return res.status(404).json({ message: "QuickBooks record not found" });
//     }

//     await Quickbook.deleteOne({ vendorId });

//     const vender = await venderModel.findById(vendorId);
//     if (!vender) {
//       return res.status(404).send({ error: "Vendor not found" });
//     }

//     vender.isQuickBook = false;
//     await vender.save();

//     res.status(200).json({
//       message: "Successfully disconnected from QuickBooks",
//       status: true,
//     });
//   } catch (error) {
//     console.error("Error during disconnection:", error);
//     res.status(500).send("Error disconnecting from QuickBooks");
//   }
// };

// module.exports = {
//   qucikBookAuth,
//   quickbookCallback,
//   quickBookPayments,
//   disconnectQuickBook,
// };
