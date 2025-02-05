import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import { access_commentsService } from "./access_comments.service";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status"
import Access_comments from "./access_comments.model";

const generate_comment = catchAsync(async (req: Request<{}, {}, { feedbackData: any, language: string, cycle: string }>, res: Response) => {

    const { usedPlan, accessCycle } = await access_commentsService.checkAccess(req.user._id, req.user.role, req.body.cycle)

    // const result = await access_commentsService.generate_comment(req.body);

    // incremnt by 1 comment_generated
    await Access_comments.findOneAndUpdate(
        { user: req?.user?._id },
        {
            $set: { [`plans.${usedPlan}.accessCycle`]: accessCycle },
            $inc: { [`plans.${usedPlan}.comment_generated`]: 1 }
        }
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Comment generated successfully',
        data: { comment: "result" },
    });
})

export const access_comments_controller = {
    generate_comment
}