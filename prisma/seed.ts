import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('Start seeding...')

    // 1. Create a Test User (Admin)
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@elite-immobilier.ci' },
        update: {
            password: adminPassword,
            role: 'admin',
            permissions: ['module:all'],
            status: 'active'
        },
        create: {
            username: 'admin',
            email: 'admin@elite-immobilier.ci',
            password: adminPassword,
            role: 'admin',
            permissions: ['module:all'],
            status: 'active'
        },
    })
    console.log(`Created/Updated user with id: ${admin.id}`)

    // 1b. Create a Restricted User (Agent)
    const agentPassword = await bcrypt.hash('agent123', 10);
    const agent = await prisma.user.upsert({
        where: { email: 'agent@elite-immobilier.ci' },
        update: {
            password: agentPassword,
            role: 'agent',
            permissions: ['properties', 'visits', 'commercial'],
            status: 'active'
        },
        create: {
            username: 'agent',
            email: 'agent@elite-immobilier.ci',
            password: agentPassword,
            role: 'agent',
            permissions: ['properties', 'visits', 'commercial'], // Limited access
            status: 'active'
        },
    })
    console.log(`Created/Updated user with id: ${agent.id}`)


    // 2. Create an Agency (Idempotent check)
    const existingAgency = await prisma.agency.findFirst({
        where: { name: 'Siège Principal - Abidjan' }
    })

    let agency;
    if (!existingAgency) {
        agency = await prisma.agency.create({
            data: {
                name: 'Siège Principal - Abidjan',
                address: 'Cocody Riviera 3',
                city: 'Abidjan',
                phone: '+225 07 07 07 07 07',
                email: 'contact@elite.ci',
                manager: 'Directeur Général'
            }
        })
        console.log(`Created agency with id: ${agency.id}`)
    } else {
        agency = existingAgency;
        console.log(`Agency already exists: ${agency.id}`)
    }

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
