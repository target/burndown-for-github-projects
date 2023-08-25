import { Router } from 'express'

const HealthRoute = Router()

HealthRoute.get('/', (req, res) => {
  res.send('👋 Hey')
})

export default HealthRoute
