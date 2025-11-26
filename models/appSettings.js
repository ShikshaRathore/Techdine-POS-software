const mongoose = require("mongoose");

const appSettingsSchema = new mongoose.Schema(
  {
    // General App Settings
    appName: {
      type: String,
      default: "Techdine",
    },
    appLogo: {
      url: {
        type: String,
        default: "/images/default-logo.png", // your default logo path
      },
      filename: {
        type: String,
        default: "default-logo.png",
      },
    },

    appFavicon: {
      type: String,
      default: "",
    },
    themeColor: {
      type: String,
      default: "#F97316", // Orange-500
    },

    // Email Settings
    emailSettings: {
      fromName: {
        type: String,
        default: "Restaurant Management",
      },
      fromEmail: {
        type: String,
        default: "Techdinesolution@gmail.com",
      },
      enableQueue: {
        type: Boolean,
        default: false,
      },
      mailDriver: {
        type: String,
        default: "SMTP",
      },
      smtpHost: {
        type: String,
        default: "",
      },
      smtpPort: {
        type: Number,
        default: 587,
      },
      smtpUsername: {
        type: String,
        default: "",
      },
      smtpPassword: {
        type: String,
        default: "",
      },
      smtpEncryption: {
        type: String,
        enum: ["tls", "ssl", "none"],
        default: "tls",
      },
      smtpVerified: {
        type: Boolean,
        default: false,
      },
    },

    // Language Settings
    languages: [
      {
        code: {
          type: String,
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        active: {
          type: Boolean,
          default: true,
        },
        rtl: {
          type: Boolean,
          default: false,
        },
        isDefault: {
          type: Boolean,
          default: false,
        },
      },
    ],

    // Payment Gateway Settings
    paymentGateways: {
      // Razorpay
      razorpay: {
        enabled: {
          type: Boolean,
          default: false,
        },
        environment: {
          type: String,
          enum: ["TEST", "LIVE"],
          default: "TEST",
        },
        testKey: {
          type: String,
          default: "",
        },
        testSecret: {
          type: String,
          default: "",
        },
        liveKey: {
          type: String,
          default: "",
        },
        liveSecret: {
          type: String,
          default: "",
        },
      },

      // Stripe
      stripe: {
        enabled: {
          type: Boolean,
          default: false,
        },
        environment: {
          type: String,
          enum: ["TEST", "LIVE"],
          default: "TEST",
        },
        testPublishableKey: {
          type: String,
          default: "",
        },
        testSecretKey: {
          type: String,
          default: "",
        },
        livePublishableKey: {
          type: String,
          default: "",
        },
        liveSecretKey: {
          type: String,
          default: "",
        },
      },

      // Offline Payment
      offlinePayment: {
        enabled: {
          type: Boolean,
          default: true,
        },
        instructions: {
          type: String,
          default: "Please contact admin for payment details",
        },
        bankDetails: {
          bankName: { type: String, default: "" },
          accountName: { type: String, default: "" },
          accountNumber: { type: String, default: "" },
          ifscCode: { type: String, default: "" },
          swiftCode: { type: String, default: "" },
        },
      },
    },

    // Push Notification Settings
    pushNotifications: {
      enabled: {
        type: Boolean,
        default: false,
      },
      provider: {
        type: String,
        enum: ["pusher", "firebase", "onesignal"],
        default: "onesignal",
      },

      // Pusher Beams
      pusher: {
        instanceId: {
          type: String,
          default: "",
        },
        beamsSecret: {
          type: String,
          default: "",
        },
      },

      // Firebase
      firebase: {
        serverKey: {
          type: String,
          default: "",
        },
        senderId: {
          type: String,
          default: "",
        },
        projectId: {
          type: String,
          default: "",
        },
      },

      // OneSignal
      onesignal: {
        appId: {
          type: String,
          default: "",
        },
        apiKey: {
          type: String,
          default: "",
        },
      },
    },

    // Currency Settings
    currencies: [
      {
        name: {
          type: String,
          required: true,
        },
        code: {
          type: String,
          required: true,
        },
        symbol: {
          type: String,
          required: true,
        },
        isDefault: {
          type: Boolean,
          default: false,
        },
        exchangeRate: {
          type: Number,
          default: 1,
        },
        active: {
          type: Boolean,
          default: true,
        },
      },
    ],

    // System Settings
    systemSettings: {
      maintenanceMode: {
        type: Boolean,
        default: false,
      },
      maintenanceMessage: {
        type: String,
        default: "We are currently under maintenance. Please check back later.",
      },
      allowRegistration: {
        type: Boolean,
        default: true,
      },
      requireEmailVerification: {
        type: Boolean,
        default: false,
      },
      sessionTimeout: {
        type: Number,
        default: 3600, // in seconds (1 hour)
      },
      maxLoginAttempts: {
        type: Number,
        default: 5,
      },
      lockoutDuration: {
        type: Number,
        default: 900, // in seconds (15 minutes)
      },
    },

    // SEO Settings
    seoSettings: {
      metaTitle: {
        type: String,
        default: "",
      },
      metaDescription: {
        type: String,
        default: "",
      },
      metaKeywords: {
        type: String,
        default: "",
      },
      googleAnalyticsId: {
        type: String,
        default: "",
      },
      facebookPixelId: {
        type: String,
        default: "",
      },
    },

    // Social Media Links
    socialMedia: {
      facebook: { type: String, default: "" },
      twitter: { type: String, default: "" },
      instagram: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      youtube: { type: String, default: "" },
    },

    // Contact Information
    contactInfo: {
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
      address: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      country: { type: String, default: "" },
      zipCode: { type: String, default: "" },
    },

    // Terms and Policies
    legalPages: {
      termsAndConditions: { type: String, default: "" },
      privacyPolicy: { type: String, default: "" },
      refundPolicy: { type: String, default: "" },
      cookiePolicy: { type: String, default: "" },
    },

    // Only Super Admin can modify
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SuperAdmin",
    },

    // Singleton flag
    isSingleton: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one settings document exists
appSettingsSchema.pre("save", async function (next) {
  if (this.isSingleton) {
    const existingSettings = await mongoose.model("AppSettings").findOne({
      _id: { $ne: this._id },
      isSingleton: true,
    });

    if (existingSettings) {
      const error = new Error("Only one AppSettings document is allowed");
      return next(error);
    }
  }
  next();
});

// Static method to get or create settings
appSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne({ isSingleton: true });

  if (!settings) {
    // Create default settings with default language
    settings = await this.create({
      isSingleton: true,
      languages: [
        {
          code: "en",
          name: "English",
          active: true,
          rtl: false,
          isDefault: true,
        },
      ],
      currencies: [
        {
          name: "US Dollar",
          code: "USD",
          symbol: "$",
          isDefault: true,
          exchangeRate: 1,
          active: true,
        },
      ],
    });
  }

  return settings;
};

// Static method to update settings (with super admin check)
appSettingsSchema.statics.updateSettings = async function (updates, userId) {
  const settings = await this.getSettings();

  // Merge updates
  Object.keys(updates).forEach((key) => {
    if (updates[key] !== undefined) {
      settings[key] = updates[key];
    }
  });

  settings.lastModifiedBy = userId;
  await settings.save();

  return settings;
};

module.exports = mongoose.model("AppSettings", appSettingsSchema);
