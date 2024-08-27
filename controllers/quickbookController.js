const OAuthClient = require("intuit-oauth");
const Quickbook = require("../models/quickbookAuth");
const oauthClient = new OAuthClient({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  environment: process.env.ENVIRONMENT,
  redirectUri: process.env.REDIRECT_URL,
});

const qucikBookAuth = async (req, res) => {
  const authUri = oauthClient.authorizeUri({
    scope: [OAuthClient.scopes.Accounting, OAuthClient.scopes.OpenId],
    state: "Init",
  });
  console.log({ authUri });
  req.session.userId = req.query.vendorId;

  res.redirect(`${authUri}`);
};

const quickbookCallback = async (req, res) => {
  console.log(req.url);
  const parseRedirect = req.url;

  const vendorId = req.session.userId;
  console.log(vendorId, "venodr");
  try {
    console.log("before response");
    const authResponse = await oauthClient.createToken(parseRedirect);
    console.log(authResponse.token, "showAuth");

    const realmId = authResponse.token.realmId;
    const access_token = authResponse.token.access_token;
    const refresh_token = authResponse.token.refresh_token;

    // Get the vendorId from query parameters

    const existingRecord = await Quickbook.findOne({ vendorId });

    if (existingRecord) {
      delete req.session.userId;
      existingRecord.realmId = realmId;
      existingRecord.accessToken = access_token;
      existingRecord.refreshToken = refresh_token;
      await existingRecord.save();
    } else {
      delete req.session.userId;
      await Quickbook.create({
        vendorId,
        realmId,
        accessToken: access_token,
        refreshToken: refresh_token,
      });
    }

    res.redirect(
      "https://gohire-frontend-eqqmb.ondigitalocean.app/system-setup/integrations/quickbook"
    );
    // res.status(200).json({
    //   success: true,
    //   data: authResponse,
    //   message: "You are connected to QuickBooks",
    // });
  } catch (error) {
    console.log("Error during token creation:", error);
    res.status(500).send("Authentication failed");
  }
};

const quickBookPayments = async (req, res) => {
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
    console.log(error);
  }
};

// New function to disconnect from QuickBooks
const disconnectQuickBook = async (req, res) => {
  const { vendorId } = req.body;

  try {
    // Find the existing record for the vendor
    const existingRecord = await Quickbook.findOne({ vendorId });

    if (existingRecord) {
      // If a record is found, make a call to revoke the access token
      const response = await oauthClient.makeApiCall({
        url: `https://sandbox-quickbooks.api.intuit.com/v3/company/${existingRecord.realmId}/companyinfo?minorversion=40`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${existingRecord.accessToken}`,
        },
        body: JSON.stringify({
          token: existingRecord.accessToken,
          token_type: "Bearer",
        }),
      });

      // Check for a successful response
      if (response.statusCode === 200) {
        // Remove the QuickBooks record from the database
        await Quickbook.deleteOne({ vendorId });

        // Clear the session
        delete req.session.userId;

        res
          .status(200)
          .json({ message: "Successfully disconnected from QuickBooks" });
      } else {
        res
          .status(response.statusCode)
          .json({ message: "Failed to disconnect from QuickBooks" });
      }
    } else {
      res.status(404).json({ message: "QuickBooks record not found" });
    }
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
