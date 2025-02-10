import OpenAI from "openai";
import AppError from "../../error/AppError";
import httpStatus from 'http-status'
import config from "../../config";
import Access_comments from "./access_comments.model";

const client = new OpenAI({
    apiKey: config.OPENAI_API_KEY,
});

const generate_comment = async (body: { feedbackData: any, language: string }) => {
    const { feedbackData, language } = body;
    const { improvements, ...others } = feedbackData;
    // const responses = await client.models.list();
    // console.log("model", responses);

    // if (!feedbackData) {
    //     return new Response(JSON.stringify({ error: "Missing feedback data" }), {
    //         status: 400,
    //         headers: { "Content-Type": "application/json" },
    //     });
    // }

    // Convert the improvements object to a string, only including areas that need improvement (i.e., where true)
    const improvementComments = improvements
        ? Object.entries(improvements)
            .filter(([area, needsImprovement]) => needsImprovement === true) // Only include areas that need improvement
            .map(([area]) => `${area} needs improvement`) // Generate improvement statements
            .join(", ") // Join all statements with commas
        : ""; // De

    let prompt = "";

    if (language === "fr") {
        // French language prompt
        const pronoun = feedbackData.gender === "Girl" ? "elle" : "il";
        const possessive = feedbackData.gender === "Girl" ? "sa" : "son";

        // Build the full prompt
        prompt = `
      Écrivez un commentaire détaillé pour le bulletin de l'élève, basé sur les données suivantes. Le commentaire doit être informatif, détaillé, mais ne pas dépasser 6 lignes. Utilisez le ton suivant : '${feedbackData?.toneOfVoice
            }'.  
      Un 'true' signifie que l'élève doit améliorer ses compétences, tandis qu'un 'false' signifie que l'élève fait bien dans ce domaine.  
      Ne commencez ni ne terminez le commentaire par des phrases génériques. 
      
      Améliorations nécessaires : ${improvementComments || "Aucune amélioration nécessaire"
            }
      
      Autres commentaires : ${JSON.stringify(others)}

      Commentaires : ${JSON.stringify(feedbackData)}

      Exemple de commentaire :  
      "Micheal a montré des progrès notables dans plusieurs domaines; ${pronoun} vocabulaire en langue parlée s'élargit et ${pronoun} commence à former des phrases simples. ${pronoun} lit des syllabes et des mots, fait des calculs, ${possessive} écriture s'améliore également et ${pronoun} écrit plus vite. Cependant, Micheal doit encore apprendre à être plus responsable et respecter les règles. Cette attitude l'aidera à améliorer ${possessive} résultats. Ses réussites sont encore fragiles mais progressent cette année. Il faut continuer à fournir des efforts. Les sessions de soutien en langue française l'aideront à consolider ses bases linguistiques."
      `;
    } else {
        // English language prompt
        const pronoun = feedbackData.gender === "Girl" ? "she" : "he";
        const possessive = feedbackData.gender === "Girl" ? "her" : "his";

        // Build the full prompt
        prompt = `
      Write a detailed comment for the student's report card based on the following feedback. The comment should be informative, detailed, and no more than 6 lines. Use the following tone: '${feedbackData?.toneOfVoice
            }'.  
      A 'true' means the student needs improvement, while a 'false' means the student is doing well in that area.  
      Do not begin or end the comment with generic sentences. 

      Improvements needed in the following areas: ${improvementComments || "No improvements needed"
            }
      
      Other feedback: ${JSON.stringify(others)}

      Feedback: ${JSON.stringify(feedbackData)}

      Example comment:  
      "Micheal has made significant progress in several areas; ${pronoun} vocabulary is expanding in spoken language and ${pronoun} is starting to form simple sentences. ${pronoun} reads syllables and words, performs calculations, ${possessive} handwriting is improving, and ${pronoun} writes faster. However, Micheal still needs to develop a more responsible attitude and respect the rules. This behavior will help ${pronoun} improve ${possessive} results. ${pronoun} achievements are still fragile but progressing this semester. Continued efforts are needed. French language support sessions will help Micheal strengthen ${possessive} linguistic foundations."
      `;
    }

    const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
        temperature: 0.7,
    });

    const comment = response.choices[0]?.message?.content?.trim();
    if (!comment) {
        // throw new Error("No valid comment generated.");
        throw new AppError(
            httpStatus.NOT_FOUND,
            'No valid comment generated.',
        );
    }

    return comment;

    // return new Response(JSON.stringify({ comment }), {
    //     status: 200,
    //     headers: { "Content-Type": "application/json" },
    // });
}

const checkAccess = async (
    userId: string,
    role: string,
    cycle: string
): Promise<{ usedPlan: string; accessCycle: string }> => {

    const userAccess = await Access_comments.findOne({ user: userId });

    if (!userAccess) {
        throw new AppError(
            httpStatus.NOT_FOUND,
            'You have not access for generate comment',
        );
    }

    let usedPlan = 'premium';
    let errMsg = ''

    //check user role is 1 and his free comment limit is finish or not
    if (role == '1') {
        if (userAccess.plans.free?.comment_generate_limit && userAccess.plans.free?.comment_generated) {
            if (userAccess.plans.free?.comment_generate_limit > userAccess.plans.free?.comment_generated) {
                usedPlan = 'free'
                return { usedPlan, accessCycle: 'all' }
            }
            else {
                throw new AppError(
                    httpStatus.FORBIDDEN,
                    'Your free limit is expired!',
                );
            }
        } else {
            throw new AppError(
                httpStatus.FORBIDDEN,
                'Your free limit is expired!',
            );
        }
    }

    if (role == '3' || role == '4') {
        if (userAccess.plans.premium?.expiredAt && (new Date(userAccess.plans.premium?.expiredAt) > new Date())) {
            if (userAccess.plans.premium?.comment_generate_limit > userAccess.plans.premium?.comment_generated) {
                usedPlan = 'premium'
                return { usedPlan, accessCycle: 'all' }
            } else {
                throw new AppError(
                    httpStatus.FORBIDDEN,
                    'Your School comment generate limit expired !',
                );
            }
        } else {
            throw new AppError(
                httpStatus.FORBIDDEN,
                'Your School subscription expired !',
            );
        }
    }

    // check user have a standard plan with expire date and comment generate limit and he use previous cycle or not
    if (userAccess.plans.standard?.expiredAt && (new Date(userAccess.plans.standard?.expiredAt) > new Date())) {
        if (userAccess.plans.standard?.comment_generate_limit > userAccess.plans.standard?.comment_generated) {
            if ((userAccess.plans.standard?.accessCycle !== 'all')) {
                if (userAccess.plans.standard?.accessCycle !== cycle) {
                    // check user have a premium plan with expire date and comment generate limit
                    if (userAccess.plans.premium?.expiredAt && (new Date(userAccess.plans.premium?.expiredAt) > new Date())) {
                        if (userAccess.plans.premium?.comment_generate_limit > userAccess.plans.premium?.comment_generated) {
                            usedPlan = 'premium'
                            return { usedPlan, accessCycle: 'all' }
                        }
                        else {
                            throw new AppError(
                                httpStatus.FORBIDDEN,
                                `You can access only cycle ${userAccess.plans.standard?.accessCycle}`,
                            );
                        }
                    }
                    else {
                        throw new AppError(
                            httpStatus.FORBIDDEN,
                            `You can access only cycle ${userAccess.plans.standard?.accessCycle}`,
                        );
                    }
                }
            }
            usedPlan = 'standard'
            return { usedPlan, accessCycle: cycle }
        }
    }



    // check user have a premium plan with expire date and comment generate limit
    if (userAccess.plans.premium?.expiredAt && (new Date(userAccess.plans.premium?.expiredAt) > new Date())) {
        if (userAccess.plans.premium?.comment_generate_limit > userAccess.plans.premium?.comment_generated) {
            usedPlan = 'premium'
            return { usedPlan, accessCycle: 'all' }
        }
    }

    throw new AppError(
        httpStatus.FORBIDDEN,
        'Your subscription or comment generate limit expired !',
    );

    // return { usedPlan, accessCycle }

    // const isExpired = existUser.expiredAt && new Date(existUser?.expiredAt) < new Date();

    // if (isExpired) {
    //     throw new AppError(
    //         httpStatus.FORBIDDEN,
    //         'Your subscription has expired!',
    //     );
    // }

    // if (existUser?.comment_generate_limit <= existUser?.comment_generated) {
    //     throw new AppError(
    //         httpStatus.FORBIDDEN,
    //         'Your comment generate limit has expired!',
    //     );
    // }
    // if (existUser?.cycle !== 'all' && (existUser?.cycle !== cycle)) {
    //     throw new AppError(
    //         httpStatus.FORBIDDEN,
    //         `You can use only ${cycle} cycle`,
    //     );
    // }

}

export const access_commentsService = {
    generate_comment,
    checkAccess
}