import { Document } from '../models/Document.js';
import { ActivityLog } from '../models/ActivityLog.js';

export const getEventDocuments = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { category } = req.query;

    const filter = { eventId };
    if (category) filter.category = category;

    const documents = await Document.find(filter)
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: documents.length,
      documents
    });
  } catch (error) {
    next(error);
  }
};

export const createDocument = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { title, category, content, fileUrl } = req.body;

    const document = await Document.create({
      eventId,
      title,
      category: category || 'Guidelines',
      content: content || '',
      fileUrl: fileUrl || '',
      uploadedBy: req.user._id
    });

    await ActivityLog.create({
      eventId,
      userId: req.user._id,
      userName: req.user.name,
      action: 'DOCUMENT_UPLOADED',
      details: `Uploaded document: "${document.title}" (${document.category})`,
      category: 'EVENT'
    });

    res.status(201).json({
      success: true,
      document
    });
  } catch (error) {
    next(error);
  }
};
