// ============================================
// FILE: controllers/customerController.js
// ============================================
const Customer = require("../models/customer");
const mongoose = require("mongoose");

// Show all customers with order count
exports.showCustomers = async (req, res) => {
  try {
    const { branchId } = req.params;

    // Fetch all customers
    const customers = await Customer.find()
      .sort({ createdAt: -1 }) // Most recent first
      .lean();

    // If you have an Order model, you can aggregate order counts
    // For now, we'll add a placeholder totalOrders field
    // You can modify this based on your Order schema

    const customersWithOrders = await Promise.all(
      customers.map(async (customer) => {
        // If you have an Order model:
        // const orderCount = await Order.countDocuments({
        //   customerId: customer._id
        // });

        // For now, using a placeholder:
        const orderCount = 0;

        return {
          ...customer,
          totalOrders: orderCount,
        };
      })
    );

    res.render("dashboard/showCustomer", {
      customers: customersWithOrders,
      branchId,
      title: "Customers",
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).render("error", {
      message: "Error loading customers",
      error: error.message,
    });
  }
};

// Create new customer
exports.createCustomer = async (req, res) => {
  try {
    const { branchId } = req.params;
    const { name, email, phone, address } = req.body;

    // Validation
    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name and phone are required",
      });
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingCustomer = await Customer.findOne({ email });
      if (existingCustomer) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }
    }

    // Create new customer
    const newCustomer = new Customer({
      name: name.trim(),
      email: email ? email.trim() : null,
      phone: parseInt(phone),
      address: address ? address.trim() : null,
      // createdBy: req.user._id, // Uncomment if you have authentication
    });

    await newCustomer.save();
    req.flash("success", "");
    res.redirect(`/dashboard/${branchId}`);
  } catch (error) {
    console.error("Error creating customer:", error);

    if (error.code === 11000) {
      // Duplicate key error
      return res.status(400).json({
        success: false,
        message: "Customer with this email already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error creating customer",
      error: error.message,
    });
  }
};

// Update customer
exports.updateCustomer = async (req, res) => {
  try {
    const { branchId } = req.params;
    const { customerId, name, email, phone, address } = req.body;

    // Validation
    if (!customerId || !name || !phone) {
      return res.status(400).json({
        success: false,
        message: "Customer ID, name, and phone are required",
      });
    }

    // Check if customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== customer.email) {
      const existingCustomer = await Customer.findOne({
        email,
        _id: { $ne: customerId },
      });
      if (existingCustomer) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }
    }

    // Update customer
    customer.name = name.trim();
    customer.email = email ? email.trim() : null;
    customer.phone = parseInt(phone);
    customer.address = address ? address.trim() : null;

    await customer.save();

    res.redirect(`/customers/show/${branchId}`);
  } catch (error) {
    console.error("Error updating customer:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error updating customer",
      error: error.message,
    });
  }
};

// Delete customer
exports.deleteCustomer = async (req, res) => {
  try {
    const { branchId } = req.params;
    const { customerId } = req.body;

    // Validation
    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required",
      });
    }

    // Check if customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Optional: Check if customer has orders before deleting
    // const hasOrders = await Order.exists({ customerId: customer._id });
    // if (hasOrders) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Cannot delete customer with existing orders",
    //   });
    // }

    // Delete customer
    await Customer.findByIdAndDelete(customerId);

    res.redirect(`/customers/show/${branchId}`);
  } catch (error) {
    console.error("Error deleting customer:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting customer",
      error: error.message,
    });
  }
};

// ============================================
// OPTIONAL: Add these methods for API endpoints
// ============================================

// Get single customer (API endpoint)
exports.getCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.json({
      success: true,
      customer,
    });
  } catch (error) {
    console.error("Error fetching customer:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching customer",
      error: error.message,
    });
  }
};

// Search customers (API endpoint)
exports.searchCustomers = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const customers = await Customer.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
        { phone: { $regex: query, $options: "i" } },
      ],
    })
      .limit(20)
      .lean();

    res.json({
      success: true,
      customers,
    });
  } catch (error) {
    console.error("Error searching customers:", error);
    res.status(500).json({
      success: false,
      message: "Error searching customers",
      error: error.message,
    });
  }
};
