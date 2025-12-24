import React, { createContext, useContext, useState } from 'react';

const AdminContext = createContext();

export const useAdmin = () => useContext(AdminContext);

export const AdminProvider = ({ children }) => {
    // 'college', 'hospital', 'business', or null (not set up)
    const [organizationType, setOrganizationType] = useState(null);

    // Mock data storage
    const [buildings, setBuildings] = useState([]);
    const [personnel, setPersonnel] = useState([]);
    const [template, setTemplate] = useState(null);

    // Templates define roles and terminology
    const templates = {
        college: {
            roles: ['Student', 'Faculty', 'Staff', 'Admin'],
            labels: { personnel: 'Faculty & Staff', customer: 'Student' }
        },
        hospital: {
            roles: ['Doctor', 'Nurse', 'Patient', 'Admin'],
            labels: { personnel: 'Medical Staff', customer: 'Patient' }
        },
        business: {
            roles: ['Employee', 'Manager', 'Admin'],
            labels: { personnel: 'Employees', customer: 'Client' }
        }
    };

    const selectTemplate = (type) => {
        if (templates[type]) {
            setOrganizationType(type);
            setTemplate(templates[type]);
        }
    };

    const addBuilding = (building) => {
        setBuildings(prev => [...prev, { ...building, id: Date.now() }]);
    };

    const value = {
        organizationType,
        template,
        buildings,
        personnel,
        selectTemplate,
        addBuilding
    };

    return (
        <AdminContext.Provider value={value}>
            {children}
        </AdminContext.Provider>
    );
};
