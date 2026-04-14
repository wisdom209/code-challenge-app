#ifndef FT_STOCK_STR_H
# define FT_STOCK_STR_H

typedef struct s_stock_str
{
    int size;
    char *str;
    char *copy;
} t_stock_str;

void    ft_show_tab(struct s_stock_str *par);
#endif
