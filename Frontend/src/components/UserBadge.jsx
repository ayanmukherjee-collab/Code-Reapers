import React from 'react';
import { GraduationCap, Stethoscope, BookOpen, User } from 'lucide-react';

/**
 * UserBadge Component
 * FIXED: Better visual hierarchy
 */
const UserBadge = ({ user }) => {
    const getRoleIcon = (role) => {
        const iconProps = { size: 18, strokeWidth: 2 };
        switch (role?.toLowerCase()) {
            case 'student': return <GraduationCap {...iconProps} />;
            case 'doctor': return <Stethoscope {...iconProps} />;
            case 'faculty': return <BookOpen {...iconProps} />;
            default: return <User {...iconProps} />;
        }
    };

    return (
        <div className="bg-black rounded-2xl p-5 shadow-xl">
            <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-14 h-14 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl flex items-center justify-center text-xl font-bold text-white">
                    {user.name?.charAt(0) || 'U'}
                </div>

                {/* Info */}
                <div className="flex-1">
                    <h3 className="font-bold text-lg text-white">
                        {user.name}
                    </h3>
                    <div className="flex items-center gap-2 text-gray-400 text-sm mt-0.5">
                        {getRoleIcon(user.role)}
                        <span>{user.role}</span>
                    </div>
                </div>
            </div>

            {/* Department Tag */}
            <div className="mt-4 pt-4 border-t border-gray-800">
                <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">Department</span>
                    <span className="bg-gray-800 px-3 py-1.5 rounded-lg text-xs font-bold text-white">
                        {user.department}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default UserBadge;
