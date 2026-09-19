import { Risk } from '../models/Risk.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { evaluateEventRisks as runRiskEngine } from '../services/riskEngineService.js';

export const getEventRisks = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { status, severity } = req.query;

    const filter = { eventId };
    if (status) filter.status = status;
    if (severity) filter.severity = severity;

    const risks = await Risk.find(filter)
      .populate('relatedTaskId', 'title deadline priority status')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: risks.length,
      risks
    });
  } catch (error) {
    next(error);
  }
};

export const createRisk = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { title, description, severity, relatedTaskId, recommendedAction } = req.body;

    const risk = await Risk.create({
      eventId,
      title,
      description,
      severity: severity || 'MEDIUM',
      source: 'MANUAL',
      relatedTaskId: relatedTaskId || null,
      recommendedAction: recommendedAction || ''
    });

    await ActivityLog.create({
      eventId,
      userId: req.user._id,
      userName: req.user.name,
      action: 'RISK_LOGGED',
      details: `Logged [${risk.severity}] risk: "${risk.title}"`,
      category: 'RISK'
    });

    res.status(201).json({
      success: true,
      risk
    });
  } catch (error) {
    next(error);
  }
};

export const resolveRisk = async (req, res, next) => {
  try {
    const risk = await Risk.findByIdAndUpdate(
      req.params.id,
      { status: 'RESOLVED', resolvedAt: new Date() },
      { new: true }
    );

    if (!risk) {
      return res.status(404).json({ success: false, message: 'Risk not found' });
    }

    await ActivityLog.create({
      eventId: risk.eventId,
      userId: req.user._id,
      userName: req.user.name,
      action: 'RISK_RESOLVED',
      details: `Resolved risk: "${risk.title}"`,
      category: 'RISK'
    });

    res.status(200).json({
      success: true,
      risk
    });
  } catch (error) {
    next(error);
  }
};

export const triggerRiskEvaluation = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const evaluation = await runRiskEngine(eventId);

    res.status(200).json({
      success: true,
      ...evaluation
    });
  } catch (error) {
    next(error);
  }
};
