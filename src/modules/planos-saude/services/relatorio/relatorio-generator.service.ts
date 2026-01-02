import { Injectable } from '@nestjs/common';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import type { TDocumentDefinitions, Content } from 'pdfmake/interfaces';
import { LoggerService } from '@/shared/logger/logger.service';
import {
  TipoRelatorio,
  DadosRelatorioColaborador,
  DadosRelatorioEmpresa,
  DadosRelatorioPagamento,
  DadosRelatorioCentroCusto,
} from '../../interfaces/relatorio.interface';

// Configurar fontes do pdfMake
(pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs;

/**
 * Service para geração de relatórios em PDF
 * Substitui Jasper Reports do legado usando PDFMake
 */
@Injectable()
export class RelatorioGeneratorService {
  constructor(private readonly logger: LoggerService) {}

  /**
   * Gera PDF e retorna como Buffer
   */
  async gerarPdf(
    tipo: TipoRelatorio,
    dados: any[],
    infoEmpresa: any,
    mes: number,
    ano: number,
  ): Promise<Buffer> {
    this.logger.log(
      `Gerando relatório PDF tipo: ${tipo}, ${dados.length} registros`,
    );

    let docDefinition: TDocumentDefinitions;

    switch (tipo) {
      case TipoRelatorio.COLABORADOR:
        docDefinition = this.gerarRelatorioColaborador(
          dados as DadosRelatorioColaborador[],
          infoEmpresa,
          mes,
          ano,
        );
        break;
      case TipoRelatorio.EMPRESA:
        docDefinition = this.gerarRelatorioEmpresa(
          dados as DadosRelatorioEmpresa[],
          infoEmpresa,
          mes,
          ano,
        );
        break;
      case TipoRelatorio.PAGAMENTO:
        docDefinition = this.gerarRelatorioPagamento(
          dados as DadosRelatorioPagamento[],
          infoEmpresa,
          mes,
          ano,
        );
        break;
      case TipoRelatorio.CENTRO_CUSTO:
        docDefinition = this.gerarRelatorioCentroCusto(
          dados as DadosRelatorioCentroCusto[],
          infoEmpresa,
          mes,
          ano,
        );
        break;
      default:
        throw new Error(`Tipo de relatório não suportado: ${tipo}`);
    }

    return new Promise((resolve, reject) => {
      try {
        const pdfDocGenerator = pdfMake.createPdf(docDefinition);
        pdfDocGenerator.getBuffer((buffer: Buffer) => {
          resolve(buffer);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Template para relatório de colaboradores
   */
  private gerarRelatorioColaborador(
    dados: DadosRelatorioColaborador[],
    infoEmpresa: any,
    mes: number,
    ano: number,
  ): TDocumentDefinitions {
    const content: Content = [
      this.gerarCabecalho('Relatório de Colaboradores', infoEmpresa, mes, ano),
      this.gerarTabelaColaboradores(dados),
      this.gerarRodape(dados),
    ];

    return {
      content,
      pageSize: 'A4',
      pageOrientation: 'landscape',
      pageMargins: [40, 60, 40, 60],
      styles: this.getStyles(),
    };
  }

  /**
   * Template para relatório de empresa
   */
  private gerarRelatorioEmpresa(
    dados: DadosRelatorioEmpresa[],
    infoEmpresa: any,
    mes: number,
    ano: number,
  ): TDocumentDefinitions {
    const content: Content = [
      this.gerarCabecalho('Relatório por Empresa', infoEmpresa, mes, ano),
      this.gerarTabelaEmpresa(dados),
      this.gerarRodape(dados),
    ];

    return {
      content,
      pageSize: 'A4',
      pageOrientation: 'portrait',
      pageMargins: [40, 60, 40, 60],
      styles: this.getStyles(),
    };
  }

  /**
   * Template para relatório de pagamentos
   */
  private gerarRelatorioPagamento(
    dados: DadosRelatorioPagamento[],
    infoEmpresa: any,
    mes: number,
    ano: number,
  ): TDocumentDefinitions {
    const content: Content = [
      this.gerarCabecalho('Relatório de Pagamentos', infoEmpresa, mes, ano),
      this.gerarTabelaPagamentos(dados),
      this.gerarRodape(dados),
    ];

    return {
      content,
      pageSize: 'A4',
      pageOrientation: 'landscape',
      pageMargins: [40, 60, 40, 60],
      styles: this.getStyles(),
    };
  }

  /**
   * Template para relatório de centro de custo
   */
  private gerarRelatorioCentroCusto(
    dados: DadosRelatorioCentroCusto[],
    infoEmpresa: any,
    mes: number,
    ano: number,
  ): TDocumentDefinitions {
    const content: Content = [
      this.gerarCabecalho(
        'Relatório por Centro de Custo',
        infoEmpresa,
        mes,
        ano,
      ),
      this.gerarTabelaCentroCusto(dados),
      this.gerarRodape(dados),
    ];

    return {
      content,
      pageSize: 'A4',
      pageOrientation: 'portrait',
      pageMargins: [40, 60, 40, 60],
      styles: this.getStyles(),
    };
  }

  /**
   * Gera cabeçalho padrão do relatório
   */
  private gerarCabecalho(
    titulo: string,
    infoEmpresa: any,
    mes: number,
    ano: number,
  ): Content {
    return [
      {
        text: titulo,
        style: 'header',
        alignment: 'center',
      },
      {
        text: `Empresa: ${infoEmpresa.sigla} - ${infoEmpresa.nome_fantasia}`,
        style: 'subheader',
        alignment: 'center',
      },
      {
        text: `Período: ${String(mes).padStart(2, '0')}/${ano}`,
        style: 'subheader',
        alignment: 'center',
        margin: [0, 0, 0, 20],
      },
    ];
  }

  /**
   * Gera rodapé com totalizadores
   */
  private gerarRodape(dados: any[]): Content {
    const now = new Date();
    return {
      text: `Gerado em: ${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR')} | Total de registros: ${dados.length}`,
      style: 'footer',
      alignment: 'center',
      margin: [0, 20, 0, 0],
    };
  }

  /**
   * Gera tabela de colaboradores
   */
  private gerarTabelaColaboradores(
    dados: DadosRelatorioColaborador[],
  ): Content {
    const body = [
      [
        { text: 'Nome', style: 'tableHeader' },
        { text: 'CPF', style: 'tableHeader' },
        { text: 'Contrato', style: 'tableHeader' },
        { text: 'Categoria', style: 'tableHeader' },
        { text: 'Titular', style: 'tableHeader' },
        { text: 'Dependentes', style: 'tableHeader' },
        { text: 'Total', style: 'tableHeader' },
      ],
    ];

    dados.forEach((item) => {
      body.push([
        item.nome,
        this.formatarCpf(item.cpf),
        item.contrato,
        item.categoria,
        this.formatarMoeda(item.valor_titular),
        `${item.qtd_dependentes} (${this.formatarMoeda(item.valor_dependente * item.qtd_dependentes)})`,
        this.formatarMoeda(item.valor_total),
      ] as any);
    });

    // Linha de total
    const total = dados.reduce((sum, item) => sum + item.valor_total, 0);
    body.push([
      { text: 'TOTAL GERAL', colSpan: 6 as any, style: 'tableHeader' },
      '' as any,
      '' as any,
      '' as any,
      '' as any,
      '' as any,
      { text: this.formatarMoeda(total), style: 'tableHeader' },
    ] as any);

    return {
      table: {
        headerRows: 1,
        widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
        body,
      },
      layout: 'lightHorizontalLines',
    };
  }

  /**
   * Gera tabela de empresa
   */
  private gerarTabelaEmpresa(dados: DadosRelatorioEmpresa[]): Content {
    const body = [
      [
        { text: 'Contrato', style: 'tableHeader' },
        { text: 'Colaboradores', style: 'tableHeader' },
        { text: 'Dependentes', style: 'tableHeader' },
        { text: 'Valor Total', style: 'tableHeader' },
      ],
    ];

    dados.forEach((item) => {
      body.push([
        item.contrato,
        item.qtd_colaboradores.toString(),
        item.qtd_dependentes.toString(),
        this.formatarMoeda(item.valor_total),
      ] as any);
    });

    const totalColaboradores = dados.reduce(
      (sum, item) => sum + item.qtd_colaboradores,
      0,
    );
    const totalDependentes = dados.reduce(
      (sum, item) => sum + item.qtd_dependentes,
      0,
    );
    const totalValor = dados.reduce((sum, item) => sum + item.valor_total, 0);

    body.push([
      { text: 'TOTAL', style: 'tableHeader' },
      {
        text: totalColaboradores.toString(),
        style: 'tableHeader',
      },
      { text: totalDependentes.toString(), style: 'tableHeader' },
      { text: this.formatarMoeda(totalValor), style: 'tableHeader' },
    ] as any);

    return {
      table: {
        headerRows: 1,
        widths: ['*', 'auto', 'auto', 'auto'],
        body,
      },
      layout: 'lightHorizontalLines',
    };
  }

  /**
   * Gera tabela de pagamentos
   */
  private gerarTabelaPagamentos(dados: DadosRelatorioPagamento[]): Content {
    const body = [
      [
        { text: 'Nome', style: 'tableHeader' },
        { text: 'CPF', style: 'tableHeader' },
        { text: 'Empresa', style: 'tableHeader' },
        { text: 'Contrato', style: 'tableHeader' },
        { text: 'Valor Total', style: 'tableHeader' },
      ],
    ];

    dados.forEach((item) => {
      body.push([
        item.nome,
        this.formatarCpf(item.cpf),
        item.empresa,
        item.contrato,
        this.formatarMoeda(item.valor_total),
      ] as any);
    });

    const total = dados.reduce((sum, item) => sum + item.valor_total, 0);
    body.push([
      { text: 'TOTAL GERAL', colSpan: 4 as any, style: 'tableHeader' },
      '' as any,
      '' as any,
      '' as any,
      { text: this.formatarMoeda(total), style: 'tableHeader' },
    ] as any);

    return {
      table: {
        headerRows: 1,
        widths: ['*', 'auto', 'auto', 'auto', 'auto'],
        body,
      },
      layout: 'lightHorizontalLines',
    };
  }

  /**
   * Gera tabela de centro de custo
   */
  private gerarTabelaCentroCusto(dados: DadosRelatorioCentroCusto[]): Content {
    const body = [
      [
        { text: 'Centro Custo', style: 'tableHeader' },
        { text: 'Descrição', style: 'tableHeader' },
        { text: 'Colaboradores', style: 'tableHeader' },
        { text: 'Valor Total', style: 'tableHeader' },
      ],
    ];

    dados.forEach((item) => {
      body.push([
        item.centro_custo,
        item.descricao,
        item.qtd_colaboradores.toString(),
        this.formatarMoeda(item.valor_total),
      ] as any);
    });

    const totalColaboradores = dados.reduce(
      (sum, item) => sum + item.qtd_colaboradores,
      0,
    );
    const totalValor = dados.reduce((sum, item) => sum + item.valor_total, 0);

    body.push([
      { text: 'TOTAL', colSpan: 2 as any, style: 'tableHeader' },
      '' as any,
      {
        text: totalColaboradores.toString(),
        style: 'tableHeader',
      },
      { text: this.formatarMoeda(totalValor), style: 'tableHeader' },
    ] as any);

    return {
      table: {
        headerRows: 1,
        widths: ['auto', '*', 'auto', 'auto'],
        body,
      },
      layout: 'lightHorizontalLines',
    };
  }

  /**
   * Formata CPF para exibição
   */
  private formatarCpf(cpf: string): string {
    if (!cpf) return '';
    const nums = cpf.replace(/\D/g, '');
    return nums.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  /**
   * Formata valor monetário
   */
  private formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  }

  /**
   * Estilos padrão para os relatórios
   */
  private getStyles(): any {
    return {
      header: {
        fontSize: 18,
        bold: true,
        margin: [0, 0, 0, 10] as [number, number, number, number],
      },
      subheader: {
        fontSize: 12,
        margin: [0, 0, 0, 5] as [number, number, number, number],
      },
      tableHeader: {
        bold: true,
        fontSize: 10,
        fillColor: '#eeeeee',
      },
      footer: {
        fontSize: 8,
        italics: true,
      },
    };
  }
}
