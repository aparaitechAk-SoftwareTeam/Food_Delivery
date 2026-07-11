const User = require("../models/User");

// Get user profile
exports.getProfile = async (req, res) => {
  

  const user = await User.findById(req.user._id).select("-password");
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  res.json(user);
};

// Update user profile
exports.updateProfile = async (req, res) => {
  

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.name = req.body.name || user.name;
  user.email = req.body.email || user.email;
  user.phone = req.body.phone || user.phone;

  const updatedUser = await user.save();
  res.json({
    id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    phone: updatedUser.phone,
  });
};

// Get saved addresses
exports.getAddresses = async (req, res) => {
  

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  res.json(user.addresses || []);
};

// Add new address
exports.addAddress = async (req, res) => {
  const { label, line1, line2, city, state, postalCode, country, isDefault } = req.body;
  const newAddress = {
    label,
    line1,
    line2,
    city,
    state,
    postalCode,
    country,
    isDefault: !!isDefault,
  };

  

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (isDefault) {
    user.addresses.forEach((addr) => {
      addr.isDefault = false;
    });
  }

  user.addresses.push(newAddress);
  await user.save();
  res.status(201).json(user.addresses);
};

// Update address details
exports.updateAddress = async (req, res) => {
  const { addressId } = req.params;
  const { label, line1, line2, city, state, postalCode, country, isDefault } = req.body;

  

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  const addr = user.addresses.id(addressId);
  if (!addr) {
    res.status(404);
    throw new Error("Address not found");
  }

  if (isDefault) {
    user.addresses.forEach(a => { a.isDefault = false; });
  }

  addr.label = label !== undefined ? label : addr.label;
  addr.line1 = line1 !== undefined ? line1 : addr.line1;
  addr.line2 = line2 !== undefined ? line2 : addr.line2;
  addr.city = city !== undefined ? city : addr.city;
  addr.state = state !== undefined ? state : addr.state;
  addr.postalCode = postalCode !== undefined ? postalCode : addr.postalCode;
  addr.country = country !== undefined ? country : addr.country;
  addr.isDefault = isDefault !== undefined ? !!isDefault : addr.isDefault;

  await user.save();
  res.json(user.addresses);
};

// Delete an address
exports.deleteAddress = async (req, res) => {
  const { addressId } = req.params;

  

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  user.addresses = user.addresses.filter(a => a._id.toString() !== addressId.toString());
  await user.save();
  res.json(user.addresses);
};

// Set address as default
exports.setDefaultAddress = async (req, res) => {
  const { addressId } = req.params;

  

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.addresses.forEach((addr) => {
    addr.isDefault = addr._id.toString() === addressId.toString();
  });

  await user.save();
  res.json(user.addresses);
};
