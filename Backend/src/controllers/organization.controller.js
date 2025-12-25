const Organization = require('../models/organization.model');

exports.createOrganization = async (req, res) => {
    try {
        const { name, type, positions, adminEmail } = req.body;

        if (!adminEmail) {
            return res.status(400).json({ message: "Admin email is required" });
        }

        const existingOrg = await Organization.findOne({ adminEmail });
        if (existingOrg) {
            return res.status(400).json({ message: "Organization already exists for this admin" });
        }

        const newOrg = new Organization({
            name,
            type,
            positions,
            adminEmail
        });

        await newOrg.save();
        res.status(201).json(newOrg);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error creating organization" });
    }
};

exports.getOrganization = async (req, res) => {
    try {
        const { email } = req.params;
        const org = await Organization.findOne({ adminEmail: email });

        if (!org) {
            return res.status(404).json({ message: "Organization not found" });
        }

        res.json(org);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error fetching organization" });
    }
};
