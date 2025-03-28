const User = require('../models/userModel');


// Fetch all pending providers (not approved yet)
exports.getPendingProviders = async (req, res) => {
    try {
        const pendingProviders = await User.find({ role: "provider", isApproved: false });

        if (!pendingProviders.length) {
            return res.status(200).json({ message: "No pending providers", data: [] });
        }

        res.status(200).json(pendingProviders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



exports.approveProvider = async (req, res) => {
    try {
        const { providerId } = req.params;

        // Find provider and update approval status
        const provider = await User.findById(providerId);
        if (!provider) return res.status(404).json({ message: "Provider not found" });

        if (provider.role !== "provider") {
            return res.status(400).json({ message: "Only providers can be approved" });
        }

        provider.isApproved = true;
        await provider.save();

        res.status(200).json({ message: "Provider approved successfully", provider });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.rejectProvider = async (req, res) => {
    try {
        const { providerId } = req.body;

        const provider = await User.findById(providerId);
        if (!provider || provider.role !== "provider") {
            return res.status(404).json({ message: "Provider not found" });
        }

        await User.findByIdAndDelete(providerId);

        res.status(200).json({ message: "Provider rejected and removed" });
    } catch (error) {
        res.status(500).json({ message: "Server error while rejecting provider" });
    }
};
