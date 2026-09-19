import { Volunteer } from '../models/Volunteer.js';
import { User } from '../models/User.js';
import { ActivityLog } from '../models/ActivityLog.js';

export const getEventVolunteers = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const volunteers = await Volunteer.find({ eventId })
      .populate('userId', 'name email role phone skills availability')
      .sort({ currentWorkload: 1, name: 1 });

    res.status(200).json({
      success: true,
      count: volunteers.length,
      volunteers
    });
  } catch (error) {
    next(error);
  }
};

export const addVolunteer = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { userId, name, email, skills, availability, maximumWorkload } = req.body;

    let targetUser;

    if (userId) {
      targetUser = await User.findById(userId);
      if (!targetUser) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
    } else if (email) {
      targetUser = await User.findOne({ email });
      if (!targetUser) {
        // Create user with default password
        targetUser = await User.create({
          name: name || 'Volunteer',
          email,
          password: 'Password@123',
          role: 'VOLUNTEER',
          skills: Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s => s.trim()) : []),
          availability: availability || 'Full Day',
          maxWorkload: maximumWorkload || 5
        });
      }
    } else {
      return res.status(400).json({ success: false, message: 'Must provide userId or email to register volunteer' });
    }

    const existingVolunteer = await Volunteer.findOne({ eventId, userId: targetUser._id });
    if (existingVolunteer) {
      return res.status(400).json({ success: false, message: 'User is already a volunteer for this event' });
    }

    const volunteer = await Volunteer.create({
      eventId,
      userId: targetUser._id,
      name: targetUser.name,
      email: targetUser.email,
      skills: targetUser.skills.length > 0 ? targetUser.skills : (Array.isArray(skills) ? skills : ['General Operations']),
      availability: availability || targetUser.availability,
      currentWorkload: 0,
      maximumWorkload: maximumWorkload || targetUser.maxWorkload || 5,
      status: 'AVAILABLE'
    });

    await ActivityLog.create({
      eventId,
      userId: req.user._id,
      userName: req.user.name,
      action: 'VOLUNTEER_ADDED',
      details: `Added ${volunteer.name} to the event volunteer roster`,
      category: 'VOLUNTEER'
    });

    res.status(201).json({
      success: true,
      volunteer
    });
  } catch (error) {
    next(error);
  }
};

export const getVolunteerRecommendations = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { category, requiredSkills } = req.query;

    const volunteers = await Volunteer.find({ eventId });
    if (!volunteers.length) {
      return res.status(200).json({ success: true, recommendations: [] });
    }

    const skillsTarget = requiredSkills ? requiredSkills.toLowerCase().split(',') : (category ? [category.toLowerCase()] : []);

    const scored = volunteers.map(vol => {
      let score = 0;
      let matchedSkills = [];

      // Check skill matches
      if (vol.skills && vol.skills.length > 0) {
        for (const skill of vol.skills) {
          const sLower = skill.toLowerCase();
          for (const target of skillsTarget) {
            if (sLower.includes(target) || target.includes(sLower)) {
              score += 30;
              matchedSkills.push(skill);
            }
          }
        }
      }

      // Workload capacity points: more free capacity = higher score
      const remainingCapacity = Math.max(0, vol.maximumWorkload - vol.currentWorkload);
      score += remainingCapacity * 15;

      // Penalize if full
      if (vol.currentWorkload >= vol.maximumWorkload) {
        score -= 50;
      }

      let reason = '';
      if (matchedSkills.length > 0) {
        reason = `Matches skills (${matchedSkills.join(', ')}) with ${remainingCapacity} available task slot${remainingCapacity === 1 ? '' : 's'}.`;
      } else {
        reason = `Available capacity (${remainingCapacity}/${vol.maximumWorkload} free slots).`;
      }

      return {
        volunteer: vol,
        score,
        matchedSkills,
        remainingCapacity,
        reason
      };
    });

    scored.sort((a, b) => b.score - a.score);

    res.status(200).json({
      success: true,
      recommendations: scored
    });
  } catch (error) {
    next(error);
  }
};
