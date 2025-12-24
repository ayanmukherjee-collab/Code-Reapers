import { BookOpen, Monitor, Coffee, Building2, Heart, Activity, Pill, ScanLine, Users, Stethoscope, Clipboard, AlertCircle } from 'lucide-react';

/**
 * dummyData.js
 * Realistic role-based data for CampusConnect
 */

export const studentContent = {
    role: 'student',
    shortcuts: [
        { id: 1, name: 'Library', icon: 'book', link: '/map' },
        { id: 2, name: 'Computer Lab', icon: 'computer', link: '/map' },
        { id: 3, name: 'Cafeteria', icon: 'coffee', link: '/map' },
        { id: 4, name: 'Admin Office', icon: 'building', link: '/map' },
    ],
    faculty: [
        { id: 1, name: 'Dr. Emily Carter', subject: 'Data Structures', room: 'Room 208', office: 'Block A', available: true },
        { id: 2, name: 'Prof. James Lee', subject: 'Machine Learning', room: 'Room 312', office: 'Block B', available: false },
        { id: 3, name: 'Dr. Maria Garcia', subject: 'Software Engineering', room: 'Room 205', office: 'Block A', available: true },
    ],
    activities: [
        { id: 1, title: 'Tech Club Weekly Meetup', description: 'Join us for a session on AI/ML trends. Refreshments will be provided!', time: '2 hours ago', location: 'Room 201, Block A' },
        { id: 2, title: 'Mid-Semester Exam Schedule Released', description: 'Check the portal for your personalized exam timetable.', time: '5 hours ago', location: 'Exam Hall' },
        { id: 3, title: 'Photography Club Exhibition', description: 'Annual exhibition showcasing student photography work.', time: 'Yesterday', location: 'Gallery Hall' },
        { id: 4, title: 'Library Extended Hours', description: 'Library will remain open until 11 PM during exam season.', time: '2 days ago', location: 'Main Library' },
    ],
    schedule: [
        { id: 1, title: 'Data Structures', location: 'Room 105, CS Block', time: '09:00 AM - 10:30 AM', status: 'past' },
        { id: 2, title: 'Machine Learning Lab', location: 'Lab 3, Block B', time: '11:00 AM - 01:00 PM', status: 'current' },
        { id: 3, title: 'Software Engineering', location: 'Room 302, CS Block', time: '02:30 PM - 04:00 PM', status: 'future' },
        { id: 4, title: 'Project Meeting', location: 'Meeting Room 2', time: '04:30 PM - 05:30 PM', status: 'future' },
    ],
};

export const doctorContent = {
    role: 'doctor',
    shortcuts: [
        { id: 1, name: 'ICU', icon: 'heart', link: '/map' },
        { id: 2, name: 'OT Complex', icon: 'activity', link: '/map' },
        { id: 3, name: 'Pharmacy', icon: 'pill', link: '/map' },
        { id: 4, name: 'Radiology', icon: 'scan', link: '/map' },
    ],
    wards: [
        { id: 1, name: 'General Ward A', floor: '2', patients: 24, available: 6 },
        { id: 2, name: 'Pediatrics Ward', floor: '3', patients: 18, available: 2 },
        { id: 3, name: 'ICU Unit 1', floor: '1', patients: 8, available: 0 },
    ],
    activities: [
        { id: 1, title: 'Emergency Staff Meeting', description: 'Briefing on new protocols for night shift.', time: '30 mins ago', location: 'Conf Room 1' },
        { id: 2, title: 'Ward A Status Update', description: '3 new admissions, full occupancy expected by evening.', time: '2 hours ago', location: 'Ward A' },
        { id: 3, title: 'New MRI Machine Calibrated', description: 'Radiology department is now fully operational with the new equipment.', time: 'Yesterday', location: 'Radiology' },
        { id: 4, title: 'Shift Roster Updated', description: 'Please check your shifts for the upcoming week.', time: '2 days ago', location: 'Admin' },
    ],
    schedule: [
        { id: 1, title: 'Morning Rounds', location: 'Ward A & B', time: '08:00 AM - 10:00 AM', status: 'past' },
        { id: 2, title: 'OPD Consultation', location: 'Room 12, Block C', time: '10:30 AM - 01:30 PM', status: 'current' },
        { id: 3, title: 'Emergency Duty', location: 'ER Ground Floor', time: '02:00 PM - 06:00 PM', status: 'future' },
        { id: 4, title: 'Department Meeting', location: 'Conf Room 2', time: '06:30 PM - 07:30 PM', status: 'future' },
    ],
};

export const quickRoutes = [
    { id: 1, name: 'Restrooms', type: 'restroom', floor: 'G' },
    { id: 2, name: 'Exit', type: 'exit', floor: 'G' },
    { id: 3, name: 'Reception', type: 'reception', floor: 'G' },
    { id: 4, name: 'Cafeteria', type: 'cafeteria', floor: '1' },
];

export const floors = [
    { id: '3', name: 'Third Floor', description: 'Labs, Auditoriums' },
    { id: '2', name: 'Second Floor', description: 'Faculty Cabins, Library' },
    { id: '1', name: 'First Floor', description: 'Classrooms, Admin' },
    { id: 'G', name: 'Ground Floor', description: 'Reception, Cafeteria, Entry' },
    { id: 'B1', name: 'Basement', description: 'Parking, Maintenance' },
];

// FIXED: Export users object for UserContext
export const users = {
    student: {
        name: 'Alex Johnson',
        role: 'student',
        department: 'Computer Science',
        avatar: 'A'
    },
    doctor: {
        name: 'Dr. Sarah Smith',
        role: 'doctor',
        department: 'Cardiology',
        avatar: 'S'
    },
    faculty: {
        name: 'Prof. Alan Turing',
        role: 'faculty',
        department: 'Mathematics',
        avatar: 'T'
    }
};
