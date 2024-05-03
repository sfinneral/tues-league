import { League, Sub, User } from "@prisma/client";
import { prisma } from "~/db.server";

export function createSub(userId: User['id'], leagueId: League['id']) {
    return prisma.sub.create({
        data: {
            userId,
            leagueId
        }
    })
}

export function getSubsByLeagueSlug(leagueSlug: League['slug']) {
    return prisma.league.findFirst(
        {
            where: { slug: leagueSlug },
            include: {
                subs: {
                    include: {
                        user: {
                            include: {
                                profile: true
                            }
                        }
                    }
                }
            }
        }
    )
}

export function deleteSub(id: Sub['id']) {
    return prisma.sub.delete({ where: { id } })
}