import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding database...')

    const hashedPassword = await bcrypt.hash('password', 12)

    // Create a default user
    const user = await prisma.user.upsert({
        where: { email: 'demo@chesskit.com' },
        update: {
            password: hashedPassword,
        },
        create: {
            email: 'demo@chesskit.com',
            name: 'Demo User',
            password: hashedPassword,
            firstName: 'Demo',
            lastName: 'Player',
        },
    })

    console.log(`Created user: ${user.name} (${user.id})`)

    // Create a sample game
    const game = await prisma.game.create({
        data: {
            userId: user.id,
            pgn: '[Event "Casual Game"]\n[Site "Localhost"]\n[Date "2023.12.17"]\n[Round "1"]\n[White "Demo User"]\n[Black "Computer"]\n[Result "1-0"]\n\n1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 Nbd7 11. c4 c6 12. cxb5 axb5 13. Nc3 Bb7 14. Bg5 b4 15. Nb1 h6 16. Bh4 c5 17. dxe5 Nxe4 18. Bxe7 Qxe7 19. exd6 Qf6 20. Nbd2 Nxd6 21. Nc4 Nxc4 22. Bxc4 Nb6 23. Ne5 Rae8 24. Bxf7+ Rxf7 25. Nxf7 Rxe1+ 26. Qxe1 Kxf7 27. Qe3 Qg5 28. Qxg5 hxg5 29. b3 Ke6 30. a3 Kd6 31. axb4 cxb4 32. Ra5 Nd5 33. f3 Bc8 34. Kf2 Bf5 35. Ra7 g6 36. Ra6+ Kc5 37. Ke1 Nf4 38. g3 Nxh3 39. Kd2 Kb5 40. Rd6 Kc5 41. Ra6 Nf2 42. g4 Bd3 43. Re6 1-0',
            event: 'Casual Game',
            site: 'Localhost',
            date: '2023.12.17',
            whiteName: 'Demo User',
            whiteRating: 1500,
            blackName: 'Computer',
            blackRating: 1400,
            result: '1-0',
            userColor: 'white',
            analyzed: false,
        },
    })

    console.log(`Created game: ${game.id}`)
    console.log('Seeding finished.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
