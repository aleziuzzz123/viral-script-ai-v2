const { createClient } = require('@supabase/supabase-js');

exports.handler = async function (event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { userId } = JSON.parse(event.body);
    if (!userId) {
        return { statusCode: 400, body: JSON.stringify({ error: 'User ID is required' }) };
    }

    const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    try {
        // Fetch all posted videos for the user that have more than zero views
        const { data: videos, error } = await supabase
            .from('generated_content')
            .select('blueprint, views, comments')
            .eq('user_id', userId)
            .eq('is_posted', true)
            .gt('views', 0);

        if (error) throw error;
        if (!videos || videos.length < 3) {
            // Not enough data to provide a meaningful insight
            return { statusCode: 200, body: JSON.stringify({ insights: [] }) };
        }

        // --- AI Analysis Logic ---
        const insights = [];
        
        // Insight 1: Find the best performing hook category
        const categoryPerformance = {};
        videos.forEach(video => {
            if (video.blueprint && video.blueprint.hooks && video.blueprint.hooks.length > 0) {
                const category = video.blueprint.hooks[0].category;
                if (!categoryPerformance[category]) {
                    categoryPerformance[category] = { totalViews: 0, count: 0 };
                }
                categoryPerformance[category].totalViews += video.views;
                categoryPerformance[category].count++;
            }
        });

        let bestCategory = null;
        let bestAvgViews = 0;
        for (const category in categoryPerformance) {
            const avgViews = categoryPerformance[category].totalViews / categoryPerformance[category].count;
            if (avgViews > bestAvgViews) {
                bestAvgViews = avgViews;
                bestCategory = category;
            }
        }

        if (bestCategory) {
            insights.push({
                type: 'positive',
                title: 'Audience Insight',
                text: `Your videos using **${bestCategory} hooks** are performing the best. Double down on this style to maximize your reach!`
            });
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ insights }),
        };

    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};