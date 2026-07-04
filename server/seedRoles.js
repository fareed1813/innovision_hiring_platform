import mongoose from 'mongoose';
import dotenv from 'dotenv';
import JobRole from './models/JobRole.js';

dotenv.config();

const INTERNATIONAL_ROLES = [
  {
    name: 'Facility Management',
    iconKey: 'building2',
    description: 'Facility and housekeeping management roles in offices, hospitals, hotels, and commercial spaces across international postings.',
    subRoles: [
      { key: 'hk_supervisor',   label: 'HK Supervisor',                 desc: 'Supervise housekeeping staff and maintain facility cleanliness standards.' },
      { key: 'housekeeper',     label: 'Housekeeper (M/F)',             desc: 'Housekeeping and cleaning services for premium facilities.' },
      { key: 'pantry_boy',      label: 'Pantry Boy',                    desc: 'Manage pantry inventory, serve beverages, and maintain cleanliness.' },
      { key: 'office_boy',      label: 'Office Boys',                   desc: 'General office support, errands, and day-to-day administrative assistance.' },
      { key: 'me_supervisor',   label: 'M&E Supervisor',                desc: 'Supervise mechanical and electrical operations and maintenance teams.' },
      { key: 'mst',             label: 'MST (Multi Skilled Technician)', desc: 'Multi-skilled technical maintenance across mechanical, electrical, and plumbing systems.' },
      { key: 'electrician',     label: 'Electrician',                   desc: 'Electrical installation, maintenance, and repair services for commercial facilities.' },
    ],
  },
  {
    name: 'Security',
    iconKey: 'shield',
    description: 'Security personnel positions across facilities, corporates, malls, and residential complexes at international postings.',
    subRoles: [
      { key: 'security_guard',        label: 'Security Guard',          desc: 'Standard security monitoring for residential areas and retail spaces.' },
      { key: 'armed_guard',           label: 'Armed Guard',             desc: 'Specialized armed security for banks, ATMs, and high-value transports.' },
      { key: 'security_supervisor',   label: 'Security Supervisor',     desc: 'Supervise security personnel and manage shift operations efficiently.' },
      { key: 'asst_security_officer', label: 'Asst Security Officer',   desc: 'Assist in coordinating security protocols and team management.' },
      { key: 'security_officer',      label: 'Security Officer',        desc: 'Oversee overall security operations and compliance for a facility.' },
    ],
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    for (const roleData of INTERNATIONAL_ROLES) {
      const existing = await JobRole.findOne({ name: roleData.name });
      if (!existing) {
        const role = new JobRole({ ...roleData, category: 'other' });
        await role.save();
        console.log('Created ' + roleData.name);
      } else {
        console.log(roleData.name + ' already exists');
      }
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
