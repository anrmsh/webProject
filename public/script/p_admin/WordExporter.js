import { Document, Packer, Paragraph, TextRun } from 'docx';
import { Booking, BanquetHall } from '../../../models/index.js';
import { Op } from 'sequelize';

class WordExporter {
    static async generateDashboard(){
        const year = new Date().getFullYear();
        const startDate = new Date(`${year}-01-01`);
        const endDate = new Date(`${year+1}-01-01`);

        const bookings = await Booking.findAll({ where:{ date:{[Op.gte]:startDate,[Op.lt]:endDate }}, include:[BanquetHall] });

        const doc = new Document();
        doc.addSection({
            properties:{},
            children:[
                new Paragraph({ children:[new TextRun({text:`Дашборд бронирований ${year}`, bold:true, size:28})] }),
                new Paragraph({ text: '' }),
                new Paragraph({ text: `Общее количество бронирований: ${bookings.length}` }),
                new Paragraph({ text: `Подтверждено: ${bookings.filter(b=>b.status==='confirmed').length}` }),
                new Paragraph({ text: `В ожидании: ${bookings.filter(b=>b.status==='pending').length}` }),
                new Paragraph({ text: `Отменено: ${bookings.filter(b=>b.status==='cancelled').length}` }),
                new Paragraph({ text: 'Топ-5 залов по бронированиям:' })
            ]
        });

        // Топ-5 залов
        const hallMap = {};
        bookings.forEach(b=>{
            const name = b.banquetHall ? b.banquetHall.hall_name : 'Без названия';
            hallMap[name] = (hallMap[name]||0)+1;
        });

        Object.entries(hallMap)
            .sort((a,b)=>b[1]-a[1])
            .slice(0,5)
            .forEach(([name,count])=>{
                doc.addSection({ children:[ new Paragraph({ text:`${name}: ${count} бронирований` }) ] });
            });

        const buffer = await Packer.toBuffer(doc);
        return buffer;
    }
}

export default WordExporter;
