export const getHealth = (req, res) => {
    res.status(200).json({ status: 'UP', message: 'API Backend BEQV rodando perfeitamente!' });
};