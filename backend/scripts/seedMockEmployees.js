require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/users');
const EmployeeProfile = require('../src/models/employeeProfile');
const OnboardingApplication = require('../src/models/onboardingApplication');

const DEFAULT_PASSWORD = '123456!';

const mockPeople = [
  {
    username: 'employee_amy',
    email: 'employee.amy.mock@example.com',
    profile: {
      firstName: 'Amy',
      lastName: 'Wang',
      middleName: 'L',
      preferredName: 'Amy',
      department: 'Engineering',
      position: 'Software Engineer',
      address: { buildingApt: '5A', street: 'Market St', line1: 'Market St', line2: '', city: 'San Francisco', state: 'CA', zipCode: '94105' },
      phones: { cell: '415-555-1001', work: '415-555-2001' },
      ssn: '111-22-3333',
      dateOfBirth: new Date('1997-03-14'),
      gender: 'female',
      isPermanentResidentOrCitizen: true,
      residentStatus: 'citizen',
      workAuthorization: { type: '', otherTitle: '', startDate: null, endDate: null, optReceiptFileName: '' },
      reference: { firstName: 'Olivia', lastName: 'Chen', middleName: '', phone: '212-555-1010', email: 'olivia.ref@example.com', relationship: 'Friend' },
      emergencyContacts: [{ firstName: 'Evan', lastName: 'Wang', middleName: '', phone: '650-555-0199', email: 'evan.wang@example.com', relationship: 'Brother' }],
      documents: { profilePicture: 'amy_profile.jpg', driverLicense: 'amy_dl.pdf', workAuthorization: 'amy_passport.pdf' },
    },
    onboarding: { status: 'approved' },
  },
  {
    username: 'employee_brian',
    email: 'employee.brian.mock@example.com',
    profile: {
      firstName: 'Brian',
      lastName: 'Lee',
      middleName: '',
      preferredName: 'Brian',
      department: 'Data',
      position: 'Data Analyst',
      address: { buildingApt: '12B', street: '1st Ave', line1: '1st Ave', line2: '', city: 'Seattle', state: 'WA', zipCode: '98101' },
      phones: { cell: '206-555-1002', work: '206-555-2002' },
      ssn: '222-33-4444',
      dateOfBirth: new Date('1994-08-21'),
      gender: 'male',
      isPermanentResidentOrCitizen: true,
      residentStatus: 'green_card',
      workAuthorization: { type: '', otherTitle: '', startDate: null, endDate: null, optReceiptFileName: '' },
      reference: { firstName: 'Jason', lastName: 'Xu', middleName: '', phone: '425-555-1000', email: 'jason.ref@example.com', relationship: 'Manager' },
      emergencyContacts: [{ firstName: 'Lina', lastName: 'Lee', middleName: '', phone: '206-555-9999', email: 'lina.lee@example.com', relationship: 'Spouse' }],
      documents: { profilePicture: 'brian_profile.jpg', driverLicense: 'brian_dl.pdf', workAuthorization: 'brian_gc.pdf' },
    },
    onboarding: { status: 'approved' },
  },
  {
    username: 'employee_carla',
    email: 'employee.carla.mock@example.com',
    profile: {
      firstName: 'Carla',
      lastName: 'Gomez',
      middleName: 'M',
      preferredName: 'Carla',
      department: 'Product',
      position: 'Product Designer',
      address: { buildingApt: '9C', street: 'Mission St', line1: 'Mission St', line2: 'Floor 2', city: 'San Jose', state: 'CA', zipCode: '95112' },
      phones: { cell: '408-555-1003', work: '408-555-2003' },
      ssn: '333-44-5555',
      dateOfBirth: new Date('1996-12-02'),
      gender: 'female',
      isPermanentResidentOrCitizen: false,
      residentStatus: '',
      workAuthorization: { type: 'h1b', otherTitle: '', startDate: new Date('2025-01-10'), endDate: new Date('2028-01-09'), optReceiptFileName: '' },
      reference: { firstName: 'Emma', lastName: 'Diaz', middleName: '', phone: '408-555-1010', email: 'emma.ref@example.com', relationship: 'Professor' },
      emergencyContacts: [{ firstName: 'Diego', lastName: 'Gomez', middleName: '', phone: '408-555-7777', email: 'diego.gomez@example.com', relationship: 'Father' }],
      documents: { profilePicture: 'carla_profile.jpg', driverLicense: 'carla_dl.pdf', workAuthorization: 'carla_h1b.pdf' },
    },
    onboarding: { status: 'approved' },
  },
  {
    username: 'candidate_david',
    email: 'candidate.david.mock@example.com',
    profile: {
      firstName: 'David',
      lastName: 'Kim',
      middleName: '',
      preferredName: 'Dave',
      department: 'Engineering',
      position: 'Backend Engineer',
      address: { buildingApt: '3D', street: 'Pine St', line1: 'Pine St', line2: '', city: 'Austin', state: 'TX', zipCode: '73301' },
      phones: { cell: '737-555-1004', work: '' },
      ssn: '444-55-6666',
      dateOfBirth: new Date('1998-06-18'),
      gender: 'male',
      isPermanentResidentOrCitizen: false,
      residentStatus: '',
      workAuthorization: { type: 'f1_cpt_opt', otherTitle: '', startDate: new Date('2025-02-01'), endDate: new Date('2026-01-31'), optReceiptFileName: 'david_opt_receipt.pdf' },
      reference: { firstName: 'Neil', lastName: 'Park', middleName: '', phone: '512-555-1000', email: 'neil.ref@example.com', relationship: 'Friend' },
      emergencyContacts: [{ firstName: 'Anna', lastName: 'Kim', middleName: '', phone: '737-555-8888', email: 'anna.kim@example.com', relationship: 'Sister' }],
      documents: { profilePicture: 'david_profile.jpg', driverLicense: 'david_dl.pdf', workAuthorization: 'david_opt_receipt.pdf' },
    },
    onboarding: { status: 'submitted' },
  },
  {
    username: 'candidate_ella',
    email: 'candidate.ella.mock@example.com',
    profile: {
      firstName: 'Ella',
      lastName: 'Patel',
      middleName: '',
      preferredName: 'Ella',
      department: 'Finance',
      position: 'Finance Analyst',
      address: { buildingApt: '8F', street: 'Broadway', line1: 'Broadway', line2: '', city: 'New York', state: 'NY', zipCode: '10001' },
      phones: { cell: '917-555-1005', work: '' },
      ssn: '555-66-7777',
      dateOfBirth: new Date('1995-10-09'),
      gender: 'female',
      isPermanentResidentOrCitizen: true,
      residentStatus: 'citizen',
      workAuthorization: { type: '', otherTitle: '', startDate: null, endDate: null, optReceiptFileName: '' },
      reference: { firstName: 'Mia', lastName: 'Shah', middleName: '', phone: '917-555-1001', email: 'mia.ref@example.com', relationship: 'Colleague' },
      emergencyContacts: [{ firstName: 'Raj', lastName: 'Patel', middleName: '', phone: '917-555-2222', email: 'raj.patel@example.com', relationship: 'Father' }],
      documents: { profilePicture: 'ella_profile.jpg', driverLicense: 'ella_dl.pdf', workAuthorization: '' },
    },
    onboarding: { status: 'in_review' },
  },
  {
    username: 'candidate_fred',
    email: 'candidate.fred.mock@example.com',
    profile: {
      firstName: 'Fred',
      lastName: 'Zhou',
      middleName: '',
      preferredName: 'Fred',
      department: 'QA',
      position: 'QA Engineer',
      address: { buildingApt: '2A', street: 'Sunset Blvd', line1: 'Sunset Blvd', line2: '', city: 'Los Angeles', state: 'CA', zipCode: '90001' },
      phones: { cell: '323-555-1006', work: '' },
      ssn: '666-77-8888',
      dateOfBirth: new Date('1999-01-27'),
      gender: 'male',
      isPermanentResidentOrCitizen: false,
      residentStatus: '',
      workAuthorization: { type: 'h1b', otherTitle: '', startDate: new Date('2025-03-01'), endDate: new Date('2027-03-01'), optReceiptFileName: '' },
      reference: { firstName: 'Kevin', lastName: 'Lin', middleName: '', phone: '323-555-1111', email: 'kevin.ref@example.com', relationship: 'Former Lead' },
      emergencyContacts: [{ firstName: 'Yuki', lastName: 'Zhou', middleName: '', phone: '323-555-3333', email: 'yuki.zhou@example.com', relationship: 'Mother' }],
      documents: { profilePicture: 'fred_profile.jpg', driverLicense: 'fred_dl.pdf', workAuthorization: 'fred_h1b.pdf' },
    },
    onboarding: { status: 'in_progress' },
  },
];

const historyForStatus = (status) => {
  const now = new Date();
  const base = [{ status: 'not_started', changedAt: new Date(now.getTime() - 1000 * 60 * 60 * 48) }];

  if (status === 'not_started') return base;
  if (status === 'in_progress') return [...base, { status: 'in_progress', changedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24) }];
  if (status === 'submitted') return [...historyForStatus('in_progress'), { status: 'submitted', changedAt: new Date(now.getTime() - 1000 * 60 * 60 * 12) }];
  if (status === 'in_review') return [...historyForStatus('submitted'), { status: 'in_review', changedAt: new Date(now.getTime() - 1000 * 60 * 60 * 6) }];
  if (status === 'approved') return [...historyForStatus('in_review'), { status: 'approved', changedAt: new Date(now.getTime() - 1000 * 60 * 60 * 2) }];
  if (status === 'rejected') return [...historyForStatus('in_review'), { status: 'rejected', changedAt: new Date(now.getTime() - 1000 * 60 * 60 * 2) }];
  return base;
};

const ensureUser = async ({ username, email }) => {
  let user = await User.findOne({ username });
  if (!user) {
    user = new User({ username, email, password: DEFAULT_PASSWORD, role: 'employee' });
  } else {
    user.email = email;
    user.role = 'employee';
    user.password = DEFAULT_PASSWORD;
  }
  await user.save();
  return user;
};

async function seed() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is missing in environment');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  for (const person of mockPeople) {
    const user = await ensureUser(person);

    await EmployeeProfile.findOneAndUpdate(
      { user: user._id },
      {
        $set: {
          ...person.profile,
          user: user._id,
          email: user.email,
        },
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );

    await OnboardingApplication.findOneAndUpdate(
      { User: user._id },
      {
        $set: {
          User: user._id,
          positionTitle: person.profile.position,
          department: person.profile.department,
          startDate: person.profile.workAuthorization?.startDate || null,
          notes: `Mock seeded data for ${person.username}`,
          status: person.onboarding.status,
          statusHistory: historyForStatus(person.onboarding.status),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  const usernames = mockPeople.map((p) => p.username).join(', ');
  console.log(`Seed complete. Usernames: ${usernames}`);
  console.log(`Password for all seeded users: ${DEFAULT_PASSWORD}`);
}

seed()
  .then(() => mongoose.connection.close())
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err);
    mongoose.connection.close().finally(() => process.exit(1));
  });
