from aiogram.fsm.state import State, StatesGroup


class OrderFlow(StatesGroup):
    captcha = State()
    game_id = State()
    confirm = State()
    payment_choice = State()
    waiting_receipt = State()


class ReviewFlow(StatesGroup):
    waiting_text = State()


class AdminFlow(StatesGroup):
    reject_reason = State()
    broadcast_text = State()
    broadcast_confirm = State()
    wizard = State()
    review_edit = State()
