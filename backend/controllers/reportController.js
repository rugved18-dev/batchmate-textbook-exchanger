const { Report, User, Note, Book } = require('../models');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

const AUTO_HIDE_THRESHOLD = 3;

const createReport = asyncHandler(async (req, res) => {
    const { targetType, targetId, reason, description } = req.body;

    if (!['Note', 'Book', 'User'].includes(targetType)) {
        throw new AppError('Invalid target type', 400);
    }

    let target;
    switch (targetType) {
        case 'Note': target = await Note.findById(targetId); break;
        case 'Book': target = await Book.findById(targetId); break;
        case 'User': target = await User.findById(targetId); break;
    }

    if (!target) throw new AppError(`${targetType} not found`, 404);

    if (targetType === 'User' && targetId === req.user._id.toString()) {
        throw new AppError('You cannot report yourself', 400);
    }

    const existingReport = await Report.findOne({ reportedBy: req.user._id, targetType, targetId });
    if (existingReport) throw new AppError('You have already reported this', 400);

    const report = await Report.create({
        reportedBy: req.user._id, targetType, targetId, reason, description, campus: req.user.campus
    });

    target.reportCount += 1;
    if (await Report.shouldAutoHide(targetType, targetId, AUTO_HIDE_THRESHOLD)) {
        target.isHidden = true;
        if (targetType !== 'User') target.moderationStatus = 'flagged';
    }
    await target.save();

    res.status(201).json({ success: true, message: 'Report submitted successfully', report: { id: report._id, status: report.status } });
});

const getReports = asyncHandler(async (req, res) => {
    const { status = 'pending', targetType, page = 1, limit = 20 } = req.query;
    const query = { campus: req.user.role === 'admin' ? (req.query.campus || { $exists: true }) : req.user.campus };
    if (status) query.status = status;
    if (targetType) query.targetType = targetType;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [reports, total] = await Promise.all([
        Report.find(query).sort({ reportedAt: -1 }).skip(skip).limit(parseInt(limit)).populate('reportedBy', 'name email'),
        Report.countDocuments(query)
    ]);

    res.status(200).json({ success: true, count: reports.length, total, page: parseInt(page), reports });
});

const reviewReport = asyncHandler(async (req, res) => {
    const { status, moderatorNotes, actionTaken } = req.body;
    const report = await Report.findById(req.params.id);

    if (!report) throw new AppError('Report not found', 404);
    if (req.user.role === 'moderator' && report.campus !== req.user.campus) {
        throw new AppError('You can only review reports from your campus', 403);
    }

    if (actionTaken === 'content_hidden') {
        const Model = report.targetType === 'Note' ? Note : Book;
        await Model.findByIdAndUpdate(report.targetId, { isHidden: true, moderationStatus: 'rejected' });
    } else if (actionTaken === 'user_blocked') {
        await User.findByIdAndUpdate(report.targetId, { isBlocked: true });
    }

    report.status = status;
    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();
    report.moderatorNotes = moderatorNotes;
    report.actionTaken = actionTaken;
    await report.save();

    res.status(200).json({ success: true, message: 'Report reviewed successfully', report });
});

const getStats = asyncHandler(async (req, res) => {
    const [total, pending, resolved] = await Promise.all([
        Report.countDocuments({}),
        Report.countDocuments({ status: 'pending' }),
        Report.countDocuments({ status: 'resolved' })
    ]);
    res.status(200).json({ success: true, stats: { total, pending, resolved } });
});

module.exports = { createReport, getReports, reviewReport, getStats };
