import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User.js';
import { Event } from '../models/Event.js';
import { Volunteer } from '../models/Volunteer.js';
import { Task } from '../models/Task.js';
import { Meeting } from '../models/Meeting.js';
import { Risk } from '../models/Risk.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { Notification } from '../models/Notification.js';
import { AIAction } from '../models/AIAction.js';
import { Document } from '../models/Document.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    const connUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/clubops_ai';
    await mongoose.connect(connUri);
    console.log('[Seed] Connected to MongoDB for seeding...');

    // Clear existing collections
    await Promise.all([
      User.deleteMany({}),
      Event.deleteMany({}),
      Volunteer.deleteMany({}),
      Task.deleteMany({}),
      Meeting.deleteMany({}),
      Risk.deleteMany({}),
      ActivityLog.deleteMany({}),
      Notification.deleteMany({}),
      AIAction.deleteMany({}),
      Document.deleteMany({})
    ]);
    console.log('[Seed] Cleared existing data.');

    // 1. Create Organizer
    const organizer = await User.create({
      name: 'Alex Morgan',
      email: 'organizer@clubops.ai',
      password: 'Password@123',
      role: 'ORGANIZER',
      phone: '+1 555-0199',
      skills: ['Leadership', 'Event Planning', 'Budgeting'],
      availability: 'Full Time',
      maxWorkload: 10
    });

    // 2. Create 5 Volunteers
    const volunteersData = [
      {
        name: 'Rahul Sharma',
        email: 'rahul@clubops.ai',
        password: 'Password@123',
        role: 'VOLUNTEER',
        phone: '+1 555-0101',
        skills: ['Registration', 'Communication', 'PR', 'Venue'],
        availability: 'Morning & Afternoon',
        maxWorkload: 5,
        initialLoad: 2
      },
      {
        name: 'Priya Patel',
        email: 'priya@clubops.ai',
        password: 'Password@123',
        role: 'VOLUNTEER',
        phone: '+1 555-0102',
        skills: ['Technical', 'Audio/Visual', 'Stage Management'],
        availability: 'Full Day',
        maxWorkload: 5,
        initialLoad: 3
      },
      {
        name: 'Amit Verma',
        email: 'amit@clubops.ai',
        password: 'Password@123',
        role: 'VOLUNTEER',
        phone: '+1 555-0103',
        skills: ['Design', 'Marketing', 'Social Media'],
        availability: 'Evenings Only',
        maxWorkload: 5,
        initialLoad: 4 // Near Capacity!
      },
      {
        name: 'Neha Singh',
        email: 'neha@clubops.ai',
        password: 'Password@123',
        role: 'VOLUNTEER',
        phone: '+1 555-0104',
        skills: ['Logistics', 'Hospitality', 'Catering', 'Registration'],
        availability: 'Full Day',
        maxWorkload: 5,
        initialLoad: 1 // High Availability!
      },
      {
        name: 'Karan Joshi',
        email: 'karan@clubops.ai',
        password: 'Password@123',
        role: 'VOLUNTEER',
        phone: '+1 555-0105',
        skills: ['Sponsorship', 'Finance', 'Documentation'],
        availability: 'Full Day',
        maxWorkload: 4,
        initialLoad: 0 // Available!
      }
    ];

    const createdUsers = [];
    for (const vData of volunteersData) {
      const user = await User.create({
        name: vData.name,
        email: vData.email,
        password: vData.password,
        role: vData.role,
        phone: vData.phone,
        skills: vData.skills,
        availability: vData.availability,
        maxWorkload: vData.maxWorkload
      });
      createdUsers.push({ user, initialLoad: vData.initialLoad });
    }

    // 3. Create Golden Demo Event: National Tech Summit 2026
    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() + 7); // 7 days from now

    const event = await Event.create({
      name: 'National Tech Summit 2026',
      description: 'Premier national university conference on Artificial Intelligence, Cloud Infrastructure, and Next-Gen Engineering.',
      venue: 'Main Auditorium & Hall B',
      eventDate,
      startTime: '09:00',
      endTime: '18:00',
      status: 'PLANNING',
      expectedAudience: 500,
      organizerId: organizer._id
    });

    // 4. Enroll Volunteers into Event
    const enrolledVolunteers = [];
    for (const item of createdUsers) {
      const vol = await Volunteer.create({
        eventId: event._id,
        userId: item.user._id,
        name: item.user.name,
        email: item.user.email,
        skills: item.user.skills,
        availability: item.user.availability,
        currentWorkload: item.initialLoad,
        maximumWorkload: item.user.maxWorkload,
        status: item.initialLoad >= item.user.maxWorkload ? 'BUSY' : 'AVAILABLE'
      });
      enrolledVolunteers.push(vol);
    }

    // 5. Create 10 Real Operational Tasks
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const inTwoDays = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const inFiveDays = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

    const tasksData = [
      // Completed Tasks
      {
        title: 'Book Main Auditorium & sign campus permit',
        category: 'Venue',
        priority: 'HIGH',
        status: 'COMPLETED',
        assignedTo: createdUsers[0].user._id,
        assignedVolunteerName: createdUsers[0].user.name,
        deadline: twoDaysAgo
      },
      {
        title: 'Design event identity logo & social banners',
        category: 'Design',
        priority: 'MEDIUM',
        status: 'COMPLETED',
        assignedTo: createdUsers[2].user._id,
        assignedVolunteerName: createdUsers[2].user.name,
        deadline: yesterday
      },
      {
        title: 'Setup online registration form gateway',
        category: 'Registration',
        priority: 'HIGH',
        status: 'COMPLETED',
        assignedTo: createdUsers[1].user._id,
        assignedVolunteerName: createdUsers[1].user.name,
        deadline: yesterday
      },
      // In Progress Tasks
      {
        title: 'Stage lighting and Hall B audio setup test',
        category: 'Technical',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        assignedTo: createdUsers[1].user._id,
        assignedVolunteerName: createdUsers[1].user.name,
        deadline: inTwoDays
      },
      {
        title: 'Print sponsor rollup banners and lanyards',
        category: 'Marketing',
        priority: 'MEDIUM',
        status: 'IN_PROGRESS',
        assignedTo: createdUsers[2].user._id,
        assignedVolunteerName: createdUsers[2].user.name,
        deadline: inTwoDays
      },
      // Overdue Tasks (triggers risk engine demonstration!)
      {
        title: 'Confirm Keynote Speaker Dr. Thorne flight schedule',
        category: 'Hospitality',
        priority: 'CRITICAL',
        status: 'TODO',
        assignedTo: createdUsers[0].user._id,
        assignedVolunteerName: createdUsers[0].user.name,
        deadline: yesterday // OVERDUE!
      },
      {
        title: 'Submit catering vendor deposit for 500 lunch boxes',
        category: 'Logistics',
        priority: 'HIGH',
        status: 'TODO',
        assignedTo: createdUsers[3].user._id,
        assignedVolunteerName: createdUsers[3].user.name,
        deadline: yesterday // OVERDUE!
      },
      // Unassigned Tasks (Ready for Copilot action engine demo!)
      {
        title: 'Coordinate attendee check-in desks and badge distribution',
        category: 'Registration',
        priority: 'HIGH',
        status: 'TODO',
        assignedTo: null,
        assignedVolunteerName: 'Unassigned',
        deadline: inTwoDays
      },
      {
        title: 'Configure live stream broadcast backup connection',
        category: 'Technical',
        priority: 'MEDIUM',
        status: 'TODO',
        assignedTo: null,
        assignedVolunteerName: 'Unassigned',
        deadline: inFiveDays
      },
      {
        title: 'Prepare VIP speaker mementos and certificates',
        category: 'Hospitality',
        priority: 'MEDIUM',
        status: 'TODO',
        assignedTo: createdUsers[2].user._id,
        assignedVolunteerName: createdUsers[2].user.name,
        deadline: inFiveDays
      }
    ];

    const createdTasks = [];
    for (const t of tasksData) {
      const task = await Task.create({
        eventId: event._id,
        title: t.title,
        description: `Operational deliverable for ${event.name}`,
        category: t.category,
        priority: t.priority,
        status: t.status,
        assignedTo: t.assignedTo,
        assignedVolunteerName: t.assignedVolunteerName,
        deadline: t.deadline,
        createdBy: organizer._id,
        source: 'MANUAL'
      });
      createdTasks.push(task);
    }

    // 6. Pre-seed Meeting with Demo Transcript
    const demoTranscript = `"Meeting Minutes - Tech Summit Core Committee
Date: September 22, 2026. Participants: Rahul, Priya, Amit, Neha, Karan.

Organizer: Let's review where we stand. We have less than a week left.
Rahul: I will confirm the main auditorium acoustics and seating by tomorrow evening.
Priya: The registration form has reached 400 entries. I will finalize and freeze the attendee list by Friday.
Amit: I was supposed to get the sponsorship banners printed, but the sponsor hasn't sent high-res logos yet. This might delay printing.
Neha: I can take care of ordering the speaker mementos and food coupons by Thursday.
Organizer: What about our keynote speaker, Dr. Aris Thorne? Has anyone received his flight confirmation?
Amit: No, the speaker confirmation is still pending. We reached out twice with no reply.
Rahul: Someone should also test the live streaming rig in Hall B.
Organizer: Great. Amit, make sure you don't take on more tasks since you're already handling 4 items."`;

    await Meeting.create({
      eventId: event._id,
      title: 'Core Committee Kickoff & Readiness Check',
      date: new Date(),
      participants: ['Alex Morgan', 'Rahul Sharma', 'Priya Patel', 'Amit Verma', 'Neha Singh', 'Karan Joshi'],
      notes: 'Reviewed venue status, audio testing, and keynote speaker pending confirmation.',
      transcript: demoTranscript,
      analyzed: false,
      createdBy: organizer._id
    });

    // 7. Seed Initial Operational Risk
    await Risk.create({
      eventId: event._id,
      title: 'Keynote Speaker confirmation pending',
      description: 'Speaker Dr. Aris Thorne attendance and flight details have not been confirmed with only 7 days to event date.',
      severity: 'CRITICAL',
      source: 'AI_ANALYSIS',
      recommendedAction: 'Assign an organizer or lead volunteer to make an urgent direct phone follow-up today.',
      status: 'OPEN'
    });

    // 8. Seed Initial Activity Logs
    await ActivityLog.create({
      eventId: event._id,
      userId: organizer._id,
      userName: organizer.name,
      action: 'EVENT_INITIALIZED',
      details: `Initialized event workspace for "${event.name}" with 5 volunteers and 10 operational tasks`,
      category: 'EVENT'
    });

    // 9. Seed Sample Guidelines Document
    await Document.create({
      eventId: event._id,
      title: 'National Tech Summit 2026 - Master Operational Guidelines',
      category: 'Guidelines',
      content: `National Tech Summit 2026 Operations Handbook.
Key Contacts:
- Event Lead: Alex Morgan (organizer@clubops.ai)
- Registration Desk: Opens 08:30 AM at Main Gate.
- Technical Support: Hall B soundboard frequency 433MHz.
- Keynote Speaker Protocol: VIP green room 102.`,
      uploadedBy: organizer._id
    });

    console.log('----------------------------------------------------');
    console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('----------------------------------------------------');
    console.log(`Demo Organizer Login:`);
    console.log(`  Email:    organizer@clubops.ai`);
    console.log(`  Password: Password@123`);
    console.log(`Demo Volunteer Login:`);
    console.log(`  Email:    rahul@clubops.ai`);
    console.log(`  Password: Password@123`);
    console.log(`Event Created: "${event.name}" [ID: ${event._id}]`);
    console.log('----------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error] Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
