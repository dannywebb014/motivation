-- motivation. — load your existing quotes into the database.
-- Run once in the Supabase SQL editor, AFTER schema.sql.
-- Replace the email below with the account you sign in to motivation. with.
--
-- The quote text is wrapped in $q$ … $q$ rather than ordinary quotes, so
-- apostrophes inside a quote can't cut the string short.

with me as (
  select id from auth.users where email = $q$YOUR-EMAIL-HERE$q$
),
incoming (text, author) as (
  values
    ($q$Try to expose yourself to the best things humans have done and then try to bring those thing into what you’re doing.$q$, $q$Steve Jobs$q$),
    ($q$Goals are for people who care about winning once. Systems are for people who care about winning repeatedly.$q$, $q$$q$),
    ($q$Stillness is a radical act in today’s world. Reclaiming presence starts with simple acts: placing your phone face-down, sitting in silence, or truly savouring a meal. By pausing, we disrupt the cycle of endless consumption and rediscover our own thoughts.$q$, $q$$q$),
    ($q$I learned a long time ago that there is something worse than missing the goal, and that’s not pulling the trigger.$q$, $q$Mia Hamm$q$),
    ($q$The secret of getting ahead is getting started. The secret of getting started is breaking your complex overwhelming tasks into small, manageable tasks, and then starting on the first one.$q$, $q$$q$),
    ($q$Stop consuming. Start creating.$q$, $q$$q$),
    ($q$Confusion is a gift from God. Those times when you feel most desperate for a solution, sit. Wait. The information will become clear. The confusion is there to guide you. Seek detachment and become the producer of your life.$q$, $q$RZA, The Tao of Wu$q$),
    ($q$People think they’re healthy just because they are not physically ill. If you’re drinking and smoking, overweight, eating a lot of fast food and not enough fruit, vegetables, and herbs, not getting enough rest and water, then you’re body is not in the best state to fight a virus. Do not wait until you are too sick to change your eating habits. Do not wait until you are too sick to rest. Do not wait until you are too sick to care about your health and wellness.$q$, $q$$q$),
    ($q$Live with urgency. You don’t have as much time as you think you do. The days are long but the decades are short. You blink and decades will pass you by. Make this your new mantra: Do it now. Do it now. Do it now. If something can be done in the present, there is absolutely no reason to wait. Delay is the enemy. Urgency must become second nature — especially for the things that truly matter. Act as if hesitation could cost you everything, as if inaction would lead to irreversible loss. Picture the worst-case scenario if you don’t move now — the kind of regret you’d carry for years.$q$, $q$$q$),
    ($q$Not taking risks leads to regrets which ages you faster. You feel like you could have done more but you never do. You always move decisions to the future where you have zero accountability. It’s f*cking sad, man.$q$, $q$$q$),
    ($q$Busyness isn’t cool. It means your life is out of control and you have no focus.$q$, $q$$q$),
    ($q$My health isn’t just about me. Having energy and the freedom to move, play, express, experience and be fully present for the moments that matter most… that’s what it’s all about. Showing up as the best version of myself for me and my family is my reason.$q$, $q$$q$)
)
insert into public.motivation_quotes (user_id, text, author)
select me.id, incoming.text, incoming.author
from me, incoming
where not exists (
  select 1 from public.motivation_quotes q
  where q.user_id = me.id and q.text = incoming.text
);

-- check they landed:
-- select count(*) from public.motivation_quotes;
